import React from 'react';
import { Mail, Shield, Zap, CheckCircle, Github, Twitter, Linkedin, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl shadow-medium">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900">EmailValidator</h3>
                <p className="text-sm text-neutral-600">Professional Email Validation Service</p>
              </div>
            </div>
            <p className="text-neutral-600 mb-6 max-w-md">
              Trusted by 10,000+ companies worldwide. Validate emails with 99.9% accuracy using our advanced 4-layer validation system.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Shield className="w-4 h-4 text-success-600" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Zap className="w-4 h-4 text-primary-600" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <CheckCircle className="w-4 h-4 text-success-600" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Email Validation
                </a>
              </li>
              <li>
                <a href="#api" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  API Documentation
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="#enterprise" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Enterprise Solutions
                </a>
              </li>
              <li>
                <a href="#integrations" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#about" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  About Us
                </a>
              </li>
              <li>
                <a href="#blog" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Blog
                </a>
              </li>
              <li>
                <a href="#careers" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Careers
                </a>
              </li>
              <li>
                <a href="#contact" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Contact
                </a>
              </li>
              <li>
                <a href="#press" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Press Kit
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-neutral-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-neutral-600">
              <span>&copy; 2024 EmailValidator. All rights reserved.</span>
              <a href="#privacy" className="hover:text-neutral-900 transition-colors duration-200">Privacy Policy</a>
              <a href="#terms" className="hover:text-neutral-900 transition-colors duration-200">Terms of Service</a>
              <a href="#cookies" className="hover:text-neutral-900 transition-colors duration-200">Cookie Policy</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="https://twitter.com/emailvalidator" className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/emailvalidator" className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://github.com/emailvalidator" className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://emailvalidator.com" className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 