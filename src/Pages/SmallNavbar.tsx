import React from 'react';
import  {Link} from 'react-router-dom';
import Help from './Help';


const SmallNavbar = () => {
  return (
    <div className="w-full bg-[#121212] text-white text-xs sm:text-sm py-3 px-4 sm:px-8 border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        
      
        <div className="flex items-center justify-center gap-2 text-center md:text-left flex-1">
    
          <p className="font-normal text-gray-200">
            DGS | Digital Guard System For Your Web & Apps To Prevent From Cyber Attacks And Crimes
          </p>
          <a
            href="#read-more"
            className="text-purple-400 hover:text-purple-300 underline font-medium whitespace-nowrap ml-1 flex items-center gap-1 transition-colors"
          >
            Read more <span className="no-underline">&gt;</span>
          </a>
        </div>

        {/* Right Links Section */}
        <div className="flex items-center gap-3 text-gray-300 text-xs sm:text-sm">
          <a 
            href="#login" 
            className="hover:text-white transition-colors"
          >
            Login
          </a>
          <span className="text-gray-600 font-light">|</span>
     
           <Link to="/help" target="_blank" className="hover:text-white transition-colors">
            Help Center
            </Link>

      
           
              
          {/* </a> */}
        </div>

      </div>
    </div>
  );
};

export default SmallNavbar;