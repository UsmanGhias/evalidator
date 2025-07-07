import re
import dns.resolver
import smtplib
import socket
from email_validator import validate_email, EmailNotValidError
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import requests
import ssl
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailValidator:
    """
    Professional email validation engine with 4-layer validation:
    1. Syntax validation
    2. Domain/MX record validation  
    3. SMTP validation with multiple fallbacks
    4. Role-based email detection
    """
    
    def __init__(self):
        self.disposable_domains = self._load_disposable_domains()
        self.role_emails = self._load_role_emails()
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'EmailValidator/3.0'})
        self.timeout = 20  # Increased timeout for better reliability
        self.max_retries = 3
        
    def _load_disposable_domains(self):
        """Load comprehensive disposable email domains"""
        disposable_domains = {
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
            'mailnesia.com', 'maildrop.cc', 'mailinator2.com',
            'tempr.email', 'tmpeml.com', 'tmpmail.org', 'tmpmail.net',
            'tmpeml.com', 'guerrillamail.org', 'guerrillamail.net',
            'guerrillamailblock.com', 'guerrillamail.com',
            'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
            'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
            'guerrillamailblock.com', 'guerrillamail.com', 'guerrillamail.net',
            'guerrillamail.org', 'guerrillamailblock.com', 'guerrillamail.com',
            'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com'
        }
        return disposable_domains
    
    def _load_role_emails(self):
        """Load common role-based email patterns"""
        role_patterns = [
            'admin', 'administrator', 'webmaster', 'postmaster', 'hostmaster',
            'info', 'contact', 'support', 'help', 'sales', 'marketing',
            'newsletter', 'noreply', 'no-reply', 'donotreply', 'do-not-reply',
            'test', 'demo', 'example', 'sample', 'user', 'guest', 'anonymous',
            'service', 'services', 'team', 'staff', 'office', 'mail', 'email',
            'hello', 'hi', 'hello@', 'hi@', 'contact@', 'info@', 'support@',
            'sales@', 'marketing@', 'newsletter@', 'noreply@', 'test@', 'demo@'
        ]
        return set(role_patterns)
    
    def validate_syntax(self, email):
        """Validate email syntax using multiple methods"""
        try:
            email = email.lower().strip()
            
            # Basic regex check
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                return False, "Invalid email format"
            
            # Use email-validator library for comprehensive validation
            valid = validate_email(email, check_deliverability=False)
            return True, "Valid syntax"
            
        except EmailNotValidError as e:
            return False, str(e)
        except Exception as e:
            logger.error(f"Syntax validation error for {email}: {str(e)}")
            return False, f"Syntax validation error: {str(e)}"
    
    def validate_domain(self, email):
        """Validate domain and check for MX records"""
        try:
            domain = email.split('@')[1].lower()
            
            # Check if it's a disposable domain
            if domain in self.disposable_domains:
                return False, "Disposable email service"
            
            # Check for MX records
            try:
                mx_records = dns.resolver.resolve(domain, 'MX')
                if mx_records:
                    # Sort by priority
                    mx_records = sorted(mx_records, key=lambda x: x.preference)
                    return True, f"Domain has {len(mx_records)} MX record(s)"
                else:
                    return False, "No MX records found"
            except dns.resolver.NXDOMAIN:
                return False, "Domain does not exist"
            except dns.resolver.NoAnswer:
                return False, "No MX records found"
            except dns.resolver.Timeout:
                return False, "DNS lookup timeout"
            except Exception as e:
                logger.error(f"DNS lookup error for {domain}: {str(e)}")
                return False, f"DNS lookup error: {str(e)}"
                
        except Exception as e:
            logger.error(f"Domain validation error for {email}: {str(e)}")
            return False, f"Domain validation error: {str(e)}"
    
    def is_role_email(self, email):
        """Check if email is role-based"""
        local_part = email.split('@')[0].lower()
        return local_part in self.role_emails
    
    def validate_smtp(self, email, timeout=20):
        """Enhanced SMTP validation with multiple fallback methods"""
        try:
            domain = email.split('@')[1]
            
            # Get MX records
            mx_records = dns.resolver.resolve(domain, 'MX')
            mx_records = sorted(mx_records, key=lambda x: x.preference)
            
            # Try multiple SMTP methods
            smtp_configs = [
                {'port': 25, 'method': 'plain'},
                {'port': 587, 'method': 'tls'},
                {'port': 465, 'method': 'ssl'},
                {'port': 25, 'method': 'plain', 'timeout': 10}
            ]
            
            for config in smtp_configs:
                for mx_record in mx_records[:2]:  # Try first 2 MX records
                    try:
                        mx_host = str(mx_record.exchange)
                        port = config['port']
                        method = config['method']
                        timeout_val = config.get('timeout', timeout)
                        
                        if method == 'ssl':
                            server = smtplib.SMTP_SSL(mx_host, port, timeout=timeout_val)
                        else:
                            server = smtplib.SMTP(mx_host, port, timeout=timeout_val)
                            if method == 'tls':
                                server.starttls()
                        
                        # Set EHLO
                        server.ehlo('emailvalidator.com')
                        
                        # Set sender
                        server.mail('test@emailvalidator.com')
                        
                        # Test recipient
                        code, message = server.rcpt(email)
                        server.quit()
                        
                        if code == 250:
                            return True, "Email address exists"
                        elif code == 550:
                            return False, "Email address does not exist"
                        elif code == 451 or code == 452:
                            return "unknown", "Temporary server error - cannot verify"
                        else:
                            return "unknown", f"SMTP response: {code} {message}"
                            
                    except smtplib.SMTPConnectError:
                        continue
                    except smtplib.SMTPServerDisconnected:
                        continue
                    except socket.timeout:
                        continue
                    except ssl.SSLError:
                        continue
                    except smtplib.SMTPAuthenticationError:
                        continue
                    except Exception as e:
                        logger.debug(f"SMTP error for {email} on {mx_host}:{port}: {str(e)}")
                        continue
            
            # If all SMTP methods failed, try a simple connection test
            try:
                mx_host = str(mx_records[0].exchange)
                server = smtplib.SMTP(mx_host, 25, timeout=10)
                server.helo('emailvalidator.com')
                server.quit()
                return "unknown", "SMTP server reachable but validation inconclusive"
            except Exception:
                return "unknown", "Cannot connect to mail server"
                
        except Exception as e:
            logger.error(f"SMTP validation error for {email}: {str(e)}")
            return "unknown", f"SMTP validation error: {str(e)}"
    
    def validate_single_email(self, email):
        """Validate a single email through all validation layers"""
        email = email.lower().strip()
        
        # Layer 1: Syntax validation
        syntax_valid, syntax_message = self.validate_syntax(email)
        if not syntax_valid:
            return {
                'email': email,
                'status': 'Syntax Error',
                'details': syntax_message,
                'timestamp': time.time(),
                'is_role': False
            }
        
        # Layer 2: Domain validation
        domain_valid, domain_message = self.validate_domain(email)
        if not domain_valid:
            if "disposable" in domain_message.lower():
                status = 'Disposable'
            else:
                status = 'Invalid'
            
            return {
                'email': email,
                'status': status,
                'details': domain_message,
                'timestamp': time.time(),
                'is_role': False
            }
        
        # Check for role-based email
        is_role = self.is_role_email(email)
        
        # Layer 3: SMTP validation
        smtp_result, smtp_message = self.validate_smtp(email)
        
        if smtp_result is True:
            status = 'Valid'
        elif smtp_result is False:
            status = 'Invalid'
        else:  # smtp_result == "unknown"
            status = 'Unknown'
        
        return {
            'email': email,
            'status': status,
            'details': smtp_message,
            'timestamp': time.time(),
            'is_role': is_role
        }
    
    def validate_emails_batch(self, emails, progress_callback=None, max_workers=3):
        """Validate multiple emails with progress tracking"""
        results = []
        total_emails = len(emails)
        processed = 0
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
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
                    logger.error(f"Validation failed for {email}: {str(e)}")
                    results.append({
                        'email': email,
                        'status': 'Error',
                        'details': f'Validation failed: {str(e)}',
                        'timestamp': time.time(),
                        'is_role': False
                    })
                    processed += 1
                    
                    if progress_callback:
                        progress = (processed / total_emails) * 100
                        progress_callback(progress, processed, total_emails)
        
        return results 