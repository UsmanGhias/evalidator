import re
import dns.resolver
import smtplib
import socket
from email_validator import validate_email, EmailNotValidError
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import requests
import random
import string
import asyncio
import aiosmtplib
from typing import List, Dict, Tuple, Optional
import json
import logging
import redis
import threading
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailValidator:
    """
    Professional email validation engine using proven free tools and techniques
    Based on industry best practices from ZeroBounce, Hunter.io, and NeverBounce
    """
    
    def __init__(self, redis_client=None):
        self.disposable_domains = self._load_disposable_domains()
        self.role_prefixes = self._load_role_prefixes()
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'EmailValidator/3.0'})
        self.timeout = 10
        self.max_retries = 2
        self.redis_client = redis_client
        
        # Major email providers that block or limit SMTP validation
        self.blocked_providers = {
            'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 
            'live.com', 'yahoo.com', 'ymail.com', 'aol.com', 'icloud.com',
            'me.com', 'mac.com', 'protonmail.com', 'tutanota.com'
        }
        
        # Cache for DNS lookups and validation results
        self.dns_cache = {}
        self.catch_all_cache = {}
        
    def _load_disposable_domains(self):
        """Load comprehensive disposable email domains"""
        return {
            # Temporary email services
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'yopmail.com', 'temp-mail.org',
            'throwaway.email', 'getnada.com', 'tempmail.net',
            'fakeinbox.com', 'sharklasers.com', 'guerrillamailblock.com',
            'pokemail.net', 'spam4.me', 'bccto.me', 'chacuo.net',
            'dispostable.com', 'emailondeck.com', 'filzmail.com',
            'get-mail.cf', 'getairmail.com', 'jourrapide.com',
            'lookugly.com', 'lopl.co.cc', 'loveme.ga', 'mt2014.com',
            'mytemp.email', 'prtnx.com', 'rcpt.at', 'rtrtr.com',
            'smashmail.de', 'tafmail.com', 'teewars.org', 'tfwno.gf',
            'maildrop.cc', 'mailnesia.com', 'trashmail.com', 'spamgourmet.com',
            'mailcatch.com', 'mailexpire.com', 'tempinbox.com', 'jetable.org',
            'spambox.us', 'deadaddress.com', 'tempmail.de', 'mailforspam.com',
            'tempemail.com', 'throwawaymail.com', 'tempymail.com', 'mail-temp.com',
            'instantmailbox.com', 'mohmal.com', 'harakirimail.com', 'anonymbox.com',
            'e4ward.com', 'spamfree24.org', 'temporaryinbox.com', 'mailtemp.info',
            'temp-mail.ru', 'mintemail.com', 'getonemail.com', 'tempr.email'
        }
    
    def _load_role_prefixes(self):
        """Load role-based email prefixes"""
        return {
            'admin', 'administrator', 'info', 'support', 'help', 'contact',
            'sales', 'marketing', 'billing', 'accounts', 'noreply', 'no-reply',
            'webmaster', 'postmaster', 'hostmaster', 'root', 'abuse',
            'security', 'hr', 'human-resources', 'finance', 'accounting',
            'legal', 'compliance', 'privacy', 'gdpr', 'hello', 'welcome',
            'team', 'office', 'headquarters', 'press', 'media', 'news',
            'careers', 'jobs', 'recruitment', 'invoices', 'orders',
            'shipping', 'delivery', 'returns', 'refunds', 'service',
            'technical', 'tech', 'it', 'sysadmin', 'devops', 'dev'
        }
    
    def validate_syntax(self, email):
        """Enhanced syntax validation using email-validator library"""
        try:
            if not email or '@' not in email:
                return False, "Invalid email format"
            
            # Use email-validator library for comprehensive validation
            valid = validate_email(email, check_deliverability=False)
            return True, "Valid syntax"
            
        except EmailNotValidError as e:
            return False, str(e)
        except Exception as e:
            return False, f"Syntax validation error: {str(e)}"
    
    def get_mx_records(self, domain):
        """Get MX records with caching"""
        # Check cache first
        if domain in self.dns_cache:
            return self.dns_cache[domain]
        
        try:
            # Query MX records
            mx_result = dns.resolver.resolve(domain, 'MX')
            mx_records = sorted(mx_result, key=lambda x: x.preference)
            mx_list = [str(mx.exchange) for mx in mx_records]
            
            # Cache the result
            self.dns_cache[domain] = mx_list
            
            return mx_list
            
        except dns.resolver.NXDOMAIN:
            self.dns_cache[domain] = []
            return []
        except dns.resolver.NoAnswer:
            # Try A record as fallback
            try:
                a_result = dns.resolver.resolve(domain, 'A')
                a_list = [domain]  # Use domain itself as mail server
                self.dns_cache[domain] = a_list
                return a_list
            except:
                self.dns_cache[domain] = []
                return []
        except Exception as e:
            logger.error(f"DNS lookup error for {domain}: {str(e)}")
            self.dns_cache[domain] = []
            return []
    
    def validate_domain(self, email):
        """Enhanced domain validation with MX record check"""
        try:
            domain = email.split('@')[1].lower()
            
            # Check if it's a disposable domain
            if domain in self.disposable_domains:
                return False, "Disposable email service"
            
            # Check for obvious fake domains
            fake_tlds = {'.test', '.invalid', '.localhost', '.example'}
            if any(domain.endswith(tld) for tld in fake_tlds):
                return False, "Test/fake domain"
            
            # Get MX records
            mx_records = self.get_mx_records(domain)
            
            if not mx_records:
                return False, "No mail server found"
            
            return True, f"Domain has {len(mx_records)} mail server(s)"
                
        except Exception as e:
            return False, f"Domain validation error: {str(e)}"
    
    def detect_role_email(self, email):
        """Detect if email is role-based (not personal)"""
        local_part = email.split('@')[0].lower()
        
        # Direct match
        if local_part in self.role_prefixes:
            return True
        
        # Check for common patterns
        for prefix in self.role_prefixes:
            if (local_part.startswith(prefix + '.') or 
                local_part.startswith(prefix + '-') or 
                local_part.startswith(prefix + '_') or
                local_part.endswith('.' + prefix) or
                local_part.endswith('-' + prefix) or
                local_part.endswith('_' + prefix)):
                return True
        
        return False
    
    def is_catch_all_domain(self, domain, mx_host):
        """Detect if domain is catch-all by testing a random email"""
        if domain in self.catch_all_cache:
            return self.catch_all_cache[domain]
        
        try:
            # Generate a random email that definitely doesn't exist
            random_email = f"test{random.randint(100000, 999999)}@{domain}"
            
            # Test the random email
            result = self._smtp_validate_single(random_email, mx_host, self.timeout)
            
            # If random email is accepted, it's a catch-all
            is_catch_all = result[0] is True
            
            # Cache the result
            self.catch_all_cache[domain] = is_catch_all
            
            return is_catch_all
            
        except Exception as e:
            logger.error(f"Catch-all detection error for {domain}: {str(e)}")
            self.catch_all_cache[domain] = False
            return False
    
    def _smtp_validate_single(self, email, mx_host, timeout):
        """Single SMTP validation attempt using RCPT TO handshake"""
        try:
            server = smtplib.SMTP(timeout=timeout)
            server.connect(mx_host, 25)
            
            # Send EHLO
            server.helo('emailvalidator.com')
            
            # Send MAIL FROM (using a valid sender)
            server.mail('verify@emailvalidator.com')
            
            # Test the email address with RCPT TO
            code, message = server.rcpt(email)
            server.quit()
            
            # Professional evaluation logic based on SMTP response codes
            if code == 250:
                return True, "Email address exists"
            elif code in (550, 551, 553, 501):
                return False, "Email address rejected by server"
            elif code in (451, 452, 421, 450):
                return "unknown", "Temporary server error"
            else:
                return "unknown", f"Unclear SMTP response: {code}"
                
        except smtplib.SMTPConnectError:
            return "unknown", "Cannot connect to mail server"
        except smtplib.SMTPServerDisconnected:
            return "unknown", "Mail server disconnected"
        except socket.timeout:
            return "unknown", "SMTP timeout"
        except Exception as e:
            return "unknown", f"SMTP validation failed: {str(e)}"
    
    def validate_smtp(self, email, timeout=10):
        """Professional SMTP validation with catch-all detection"""
        domain = email.split('@')[1].lower()
        
        # Check if it's a major provider that blocks SMTP validation
        if domain in self.blocked_providers:
            return "unknown", "Major provider - SMTP validation blocked"
        
        for attempt in range(self.max_retries):
            try:
                # Get MX records
                mx_records = self.get_mx_records(domain)
                
                if not mx_records:
                    return "unknown", "No mail server found"
                
                # Try each MX record
                for mx_host in mx_records[:2]:  # Try top 2 MX records
                    try:
                        # Check if domain is catch-all
                        if self.is_catch_all_domain(domain, mx_host):
                            return "unknown", "Catch-all domain detected"
                        
                        # Validate the actual email
                        result = self._smtp_validate_single(email, mx_host, timeout)
                        if result[0] != "unknown":
                            return result
                            
                    except Exception as e:
                        continue
                
                # If all MX records failed, return unknown
                return "unknown", "SMTP validation inconclusive"
                
            except Exception as e:
                if attempt == self.max_retries - 1:
                    return "unknown", f"SMTP validation error: {str(e)}"
                time.sleep(1)
    
    def calculate_deliverability_score(self, result):
        """Calculate deliverability confidence score (0-100)"""
        score = 0
        
        # Base score by status
        if result['status'] == 'Valid':
            score = 95
        elif result['status'] == 'Invalid':
            score = 5
        elif result['status'] == 'Unknown':
            score = 60
        elif result['status'] == 'Disposable':
            score = 10
        else:
            score = 0
        
        # Adjust based on details
        details = result.get('details', '').lower()
        
        # Reduce score for major providers (blocked validation)
        if 'major provider' in details or 'validation blocked' in details:
            score = max(score - 10, 50)
        
        # Reduce score for catch-all domains
        if 'catch-all' in details:
            score = max(score - 30, 15)
        
        # Reduce score for role emails
        if result.get('is_role', False):
            score = max(score - 10, score * 0.9)
        
        # Reduce score for temporary errors
        if 'temporary' in details or 'timeout' in details:
            score = max(score - 20, 30)
        
        return min(max(int(score), 0), 100)
    
    def validate_single_email(self, email):
        """Validate a single email through all validation layers"""
        email = email.lower().strip()
        start_time = time.time()
        
        # Check Redis cache first
        if self.redis_client:
            try:
                cached_result = self.redis_client.get(f"email_validation:{email}")
                if cached_result:
                    result = json.loads(cached_result)
                    result['cached'] = True
                    return result
            except Exception as e:
                logger.error(f"Redis cache error: {str(e)}")
        
        # Layer 1: Syntax validation
        syntax_valid, syntax_message = self.validate_syntax(email)
        if not syntax_valid:
            result = {
                'email': email,
                'status': 'Syntax Error',
                'details': syntax_message,
                'is_role': False,
                'deliverability_score': 0,
                'validation_time': round(time.time() - start_time, 2),
                'timestamp': time.time(),
                'cached': False
            }
            return result
        
        # Layer 2: Domain validation
        domain_valid, domain_message = self.validate_domain(email)
        if not domain_valid:
            if "disposable" in domain_message.lower():
                status = 'Disposable'
                score = 10
            else:
                status = 'Invalid'
                score = 5
            
            result = {
                'email': email,
                'status': status,
                'details': domain_message,
                'is_role': False,
                'deliverability_score': score,
                'validation_time': round(time.time() - start_time, 2),
                'timestamp': time.time(),
                'cached': False
            }
            return result
        
        # Layer 3: Role email detection
        is_role = self.detect_role_email(email)
        
        # Layer 4: SMTP validation
        smtp_result, smtp_message = self.validate_smtp(email)
        
        if smtp_result is True:
            status = 'Valid'
        elif smtp_result is False:
            status = 'Invalid'
        else:  # smtp_result == "unknown"
            status = 'Unknown'
        
        result = {
            'email': email,
            'status': status,
            'details': smtp_message,
            'is_role': is_role,
            'validation_time': round(time.time() - start_time, 2),
            'timestamp': time.time(),
            'cached': False
        }
        
        # Layer 5: Calculate deliverability score
        result['deliverability_score'] = self.calculate_deliverability_score(result)
        
        # Cache the result in Redis
        if self.redis_client:
            try:
                # Cache for 24 hours
                self.redis_client.setex(
                    f"email_validation:{email}", 
                    86400, 
                    json.dumps(result)
                )
            except Exception as e:
                logger.error(f"Redis cache set error: {str(e)}")
        
        return result
    
    def validate_emails_batch(self, emails, progress_callback=None, max_workers=10):
        """Validate multiple emails with optimized performance and Redis caching"""
        results = []
        total_emails = len(emails)
        processed = 0
        
        # Optimize worker count based on email count
        optimal_workers = min(max_workers, max(3, total_emails // 5))
        
        with ThreadPoolExecutor(max_workers=optimal_workers) as executor:
            # Submit all tasks
            future_to_email = {
                executor.submit(self.validate_single_email, email): email 
                for email in emails
            }
            
            # Process completed tasks
            for future in as_completed(future_to_email):
                try:
                    result = future.result()
                    results.append(result)
                    processed += 1
                    
                    # Update progress
                    if progress_callback:
                        progress = (processed / total_emails) * 100
                        progress_callback(progress, processed, total_emails)
                        
                except Exception as e:
                    email = future_to_email[future]
                    results.append({
                        'email': email,
                        'status': 'Error',
                        'details': f'Validation failed: {str(e)}',
                        'is_role': False,
                        'deliverability_score': 0,
                        'validation_time': 0,
                        'timestamp': time.time(),
                        'cached': False
                    })
                    processed += 1
                    
                    if progress_callback:
                        progress = (processed / total_emails) * 100
                        progress_callback(progress, processed, total_emails)
        
        return results 