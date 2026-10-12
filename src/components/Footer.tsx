import React from 'react';

export const Footer = () => {
  return (
    <footer id="hub-colophon" className="scroll-mt-20 w-full bg-[#5D8246] text-[#FFFDD0] border-t border-[#FFFDD0]/20 py-16 md:py-20 px-6 sm:px-10">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        
        <div className="space-y-2">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-[#FF6B4A] font-bold block">
            [ THE ODYSSEUS JOURNAL • COLOPHON & CORRESPONDENCE ]
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#FFFDD0]">
            Get in Touch
          </h2>
        </div>
        
        <div className="space-y-2">
          <p className="text-base sm:text-lg font-serif text-[#FFFDD0]/90">Shubham Upadhyay</p>
          <a 
            href="mailto:shubham360upadhyay@gmail.com" 
            className="text-lg sm:text-2xl md:text-3xl font-serif italic text-[#FFFDD0]/90 hover:text-[#FF6B4A] transition-colors duration-300 block break-all"
          >
            shubham360upadhyay@gmail.com
          </a>
        </div>

        {/* Social Links */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-4">
          {/* GitHub */}
          <a 
            href="https://github.com/Shubham126710" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 rounded-full bg-[#FFFDD0]/10 border border-[#FFFDD0]/20 flex items-center justify-center hover:bg-[#FF6B4A] hover:border-[#FF6B4A] text-[#FFFDD0]/80 hover:text-[#FFFDD0] transition-all duration-300" 
            aria-label="GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
          
          {/* LinkedIn */}
          <a 
            href="https://www.linkedin.com/in/shubham-upadhyay-a12a9428b/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 rounded-full bg-[#FFFDD0]/10 border border-[#FFFDD0]/20 flex items-center justify-center hover:bg-[#FF6B4A] hover:border-[#FF6B4A] text-[#FFFDD0]/80 hover:text-[#FFFDD0] transition-all duration-300" 
            aria-label="LinkedIn"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
            </svg>
          </a>

          {/* Instagram */}
          <a 
            href="https://instagram.com/iamshubham_15" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 rounded-full bg-[#FFFDD0]/10 border border-[#FFFDD0]/20 flex items-center justify-center hover:bg-[#FF6B4A] hover:border-[#FF6B4A] text-[#FFFDD0]/80 hover:text-[#FFFDD0] transition-all duration-300" 
            aria-label="Instagram"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.416 4.48c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
            </svg>
          </a>

          {/* Twitter / X */}
          <a 
            href="https://twitter.com/iamshubham_15" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 rounded-full bg-[#FFFDD0]/10 border border-[#FFFDD0]/20 flex items-center justify-center hover:bg-[#FF6B4A] hover:border-[#FF6B4A] text-[#FFFDD0]/80 hover:text-[#FFFDD0] transition-all duration-300" 
            aria-label="Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
            </svg>
          </a>
        </div>

        <div className="pt-8 border-t border-[#FFFDD0]/15 text-[#FFFDD0]/50 font-mono text-xs uppercase tracking-widest">
          Designed by Shubham Upadhyay • Odysseus Digital Salon
        </div>
      </div>
    </footer>
  );
};
