import re
import dns.resolver
import smtplib
import socket
from email_validator import validate_email, EmailNotValidError
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import requests
import ssl

class EmailValidator:
    """
    Enhanced email validation engine with 3-layer validation:
    1. Syntax validation
    2. Domain/MX record validation  
    3. SMTP validation with improved reliability
    """
    
    def __init__(self):
        self.disposable_domains = self._load_disposable_domains()
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'EmailValidator/2.0'})
        self.timeout = 15  # Increased timeout
        self.max_retries = 2
        
    def _load_disposable_domains(self):
        """Load common disposable email domains"""
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
            'smashmail.de', 'tafmail.com', 'teewars.org', 'tfwno.gf'
        }
        
        # You can extend this by loading from an external API or file
        # For production, consider using a service like:
        # https://github.com/disposable/disposable-email-domains
        
        return disposable_domains
    
    def validate_syntax(self, email):
        """
        Validate email syntax using both regex and email-validator library
        """
        try:
            # Basic regex check first
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                return False, "Invalid email format"
            
            # Use email-validator library for comprehensive syntax validation
            valid = validate_email(email)
            return True, "Valid syntax"
            
        except EmailNotValidError as e:
            return False, str(e)
        except Exception as e:
            return False, f"Syntax validation error: {str(e)}"
    
    def validate_domain(self, email):
        """
        Validate domain and check for MX records
        """
        try:
            domain = email.split('@')[1].lower()
            
            # Check if it's a disposable domain
            if domain in self.disposable_domains:
                return False, "Disposable email service"
            
            # Check for MX records
            try:
                mx_records = dns.resolver.resolve(domain, 'MX')
                if mx_records:
                    return True, f"Domain has {len(mx_records)} MX record(s)"
                else:
                    return False, "No MX records found"
            except dns.resolver.NXDOMAIN:
                return False, "Domain does not exist"
            except dns.resolver.NoAnswer:
                return False, "No MX records found"
            except Exception as e:
                return False, f"DNS lookup error: {str(e)}"
                
        except Exception as e:
            return False, f"Domain validation error: {str(e)}"
    
    def validate_smtp(self, email, timeout=15):
        """
        Enhanced SMTP validation with better error handling
        """
        try:
            domain = email.split('@')[1]
            
            # Get MX record
            mx_records = dns.resolver.resolve(domain, 'MX')
            mx_record = str(mx_records[0].exchange)
            
            # Try multiple SMTP ports and methods
            smtp_ports = [25, 587, 465]
            smtp_methods = ['plain', 'ssl', 'tls']
            
            for port in smtp_ports:
                for method in smtp_methods:
                    try:
                        if method == 'ssl':
                            server = smtplib.SMTP_SSL(mx_record, port, timeout=timeout)
                        else:
                            server = smtplib.SMTP(mx_record, port, timeout=timeout)
                            if method == 'tls':
                                server.starttls()
                        
                        server.helo('emailvalidator.com')
                        server.mail('test@emailvalidator.com')
                        
                        # Test the email address
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
                    except Exception:
                        continue
            
            # If all methods failed, try a simpler approach
            try:
                server = smtplib.SMTP(mx_record, 25, timeout=10)
                server.helo('emailvalidator.com')
                server.mail('test@emailvalidator.com')
                code, message = server.rcpt(email)
                server.quit()
                
                if code == 250:
                    return True, "Email address exists"
                elif code == 550:
                    return False, "Email address does not exist"
                else:
                    return "unknown", f"SMTP response: {code} {message}"
                    
            except Exception as e:
                return "unknown", f"SMTP validation failed: {str(e)}"
                
        except Exception as e:
            return "unknown", f"SMTP validation error: {str(e)}"
    
    def validate_single_email(self, email):
        """
        Validate a single email through all validation layers
        """
        email = email.lower().strip()
        
        # Layer 1: Syntax validation
        syntax_valid, syntax_message = self.validate_syntax(email)
        if not syntax_valid:
            return {
                'email': email,
                'status': 'Syntax Error',
                'details': syntax_message,
                'timestamp': time.time()
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
                'timestamp': time.time()
            }
        
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
            'timestamp': time.time()
        }
    
    def validate_emails_batch(self, emails, progress_callback=None, max_workers=5):
        """
        Validate multiple emails with progress tracking
        """
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
                    results.append({
                        'email': email,
                        'status': 'Error',
                        'details': f'Validation failed: {str(e)}',
                        'timestamp': time.time()
                    })
                    processed += 1
                    
                    if progress_callback:
                        progress = (processed / total_emails) * 100
                        progress_callback(progress, processed, total_emails)
        
        return results 