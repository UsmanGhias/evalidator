import React from 'react';
import { Mail, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">EmailValidator</h3>
              <p className="text-sm text-gray-600">Professional Email Validation</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>for email marketers</span>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © 2024 EmailValidator. All rights reserved. | 
            <span className="ml-1">Validate emails with confidence</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 