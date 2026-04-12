import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import qrCode from "../assets/qr-code.png";

const Team = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gray-50 relative overflow-y-auto scrollable-container">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.02, 0.04, 0.02],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-600 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <div className="relative bg-white border-b border-gray-200 py-16 shadow-sm">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-1 bg-orange-500 mx-auto rounded-full mb-4"></div>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight text-gray-900">
              Our <span className="text-orange-500">Journey</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-light max-w-3xl mx-auto">
              A story of innovation, dedication, and passion that began <span className="font-semibold text-orange-500">2 years ago in June 2024</span>
            </p>
            <div className="mt-6 inline-block bg-orange-50 px-6 py-3 rounded-full border border-orange-200">
              <p className="text-sm text-orange-700 font-medium">
                Started with <span className="font-bold">4 passionate innovators</span>, grew into a dream team
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        {/* Journey Story */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative mb-20"
        >
          <div className="relative bg-gradient-to-br from-orange-50 to-white rounded-3xl shadow-lg p-10 md:p-16 border border-orange-200">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="w-16 h-1 bg-orange-500 mx-auto rounded-full mb-8"
            ></motion.div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              The <span className="text-orange-500">Reliv</span> Story
            </h2>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-gray-700 text-lg leading-relaxed text-center mb-8">
                The journey of <span className="font-bold text-orange-500">Reliv</span> started <span className="font-bold">2 years ago in June 2024</span>. 
                What began as a vision has transformed into reality through sheer dedication and personal investment - 
                <span className="font-bold text-orange-600"> over ₹1.3 lakhs</span> spent from personal funds, countless sleepless nights, and unwavering commitment.
              </p>
              
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Built From Scratch</h3>
                <p className="text-gray-700 leading-relaxed mb-6 text-center">
                  Right from building the website from the very scratch to making the kiosk machine - 
                  <span className="font-bold"> every single component</span> has been crafted by our innovators. 
                  No shortcuts. No templates. Pure innovation.
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-500 mb-1">37+</div>
                    <div className="text-sm text-gray-600">Research Papers</div>
                    <div className="text-xs text-gray-500 mt-1">Studied by team</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-500 mb-1">₹1.3L+</div>
                    <div className="text-sm text-gray-600">Personal Investment</div>
                    <div className="text-xs text-gray-500 mt-1">Self-funded</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-500 mb-1">100%</div>
                    <div className="text-sm text-gray-600">Documented</div>
                    <div className="text-xs text-gray-500 mt-1">Every step recorded</div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed text-center">
                  Our research team studied <span className="font-bold">more than 37 research papers</span> to identify market gaps and areas lagging behind. 
                  Each and every work - from the website to the final kiosk - has been <span className="font-bold">meticulously documented</span>.
                </p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8 shadow-sm border border-orange-200">
                <div className="text-center">
                  <div className="text-4xl mb-4">💛</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">You Make It All Worth It</h3>
                  <p className="text-gray-700 leading-relaxed">
                    <span className="font-semibold">Each time you visit our kiosk</span>, it's a pleasure for us and a happy feeling for all the time and effort we've invested. 
                    Your trust validates our journey. We hope to serve you the best and with great pleasure. 
                    <span className="block mt-4 text-orange-600 font-semibold">Your smile makes every sacrifice worth it. 😊</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Instagram QR Code Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-20"
        >
          <div className="relative bg-white rounded-3xl shadow-lg p-10 md:p-16 border border-gray-200 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full opacity-5 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-600 rounded-full opacity-5 blur-3xl"></div>
            
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="w-16 h-1 bg-orange-500 mx-auto rounded-full mb-8"
              ></motion.div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
                Follow Our <span className="text-orange-500">Journey</span>
              </h2>
              <p className="text-gray-600 text-lg text-center mb-10 max-w-2xl mx-auto">
                Stay connected with us on Instagram for updates, behind-the-scenes content, and more
              </p>
              
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative bg-white p-2 rounded-3xl shadow-2xl border-4 border-orange-500">
                    <img 
                      src={qrCode} 
                      alt="Reliv Instagram QR Code" 
                      className="w-64 h-64 md:w-80 md:h-80 rounded-2xl object-cover"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="mt-8 text-center"
                >
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 rounded-2xl border border-orange-200 shadow-sm">
                    <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-orange-600">Scan to Follow</p>
                      <p className="text-xs text-gray-600">@reliv_care</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.7 }}
                  className="mt-6 text-gray-500 text-sm text-center max-w-md"
                >
                  Join our growing community and be part of the healthcare revolution
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gratitude Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="mb-20"
        >
          <div className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 rounded-3xl shadow-2xl p-10 md:p-16 border border-orange-200 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300 rounded-full opacity-20 blur-3xl"></div>
            
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.6, type: "spring" }}
                className="w-16 h-1 bg-orange-500 mx-auto rounded-full mb-8"
              ></motion.div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
                A Heartfelt <span className="text-orange-600">Thank You</span>
              </h2>
              
              <div className="max-w-3xl mx-auto">
                <p className="text-gray-700 text-lg leading-relaxed text-center mb-8">
                  <span className="font-semibold text-orange-600">Soon, we will introduce you to the innovators</span> behind this mission. 
                  All your questions - "Why Reliv?", "How was it built?", "Who is behind it?" - will be answered.
                </p>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-orange-200 mb-6 shadow-sm">
                  <div className="flex flex-col items-center">
                    <div className="text-6xl mb-4">💛</div>
                    <p className="text-gray-900 text-xl font-semibold mb-3 text-center">
                      Each Time You Visit Makes Us Feel Special
                    </p>
                    <p className="text-gray-700 text-center leading-relaxed">
                      <span className="font-semibold">Each and every visit you make to our kiosk makes us feel special and valued.</span> 
                      It's a reminder that our journey - the late nights, the investments, the sacrifices - was all worth it. 
                      <span className="block mt-3 text-orange-600 font-medium">We're on this journey together, hoping to serve you better each time.</span>
                    </p>
                    <p className="text-orange-600 font-semibold mt-4 text-lg">
                      The smile never fades. 😊
                    </p>
                    <p className="text-gray-600 mt-2 text-sm italic">
                      - With love, Team Reliv
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-orange-200 shadow-sm">
                    <div className="text-3xl mb-2">💡</div>
                    <h4 className="text-orange-600 font-bold mb-2">Innovation</h4>
                    <p className="text-gray-700 text-sm">
                      Pushing boundaries and thinking beyond the conventional
                    </p>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-orange-200 shadow-sm">
                    <div className="text-3xl mb-2">🤝</div>
                    <h4 className="text-orange-600 font-bold mb-2">Collaboration</h4>
                    <p className="text-gray-700 text-sm">
                      Working together to achieve what seemed impossible
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-10 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </span>
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-t-2 border-orange-200 py-10 mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
            >
              <h3 className="text-xl font-bold mb-2 text-orange-600">
                Reliv
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                © 2024-2026 Reliv. All rights reserved. | Making healthcare accessible for everyone.
              </p>
              <div className="flex justify-center gap-6 text-gray-500 text-sm">
                <span className="hover:text-orange-600 cursor-pointer transition-colors">Privacy Policy</span>
                <span>•</span>
                <span className="hover:text-orange-600 cursor-pointer transition-colors">Terms of Service</span>
                <span>•</span>
                <span className="hover:text-orange-600 cursor-pointer transition-colors">Contact Us</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;
