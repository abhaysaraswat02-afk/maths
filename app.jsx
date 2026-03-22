import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Video, ChevronRight, PlayCircle, CheckCircle } from 'lucide-react';

const EraOfMathAntics = () => {
  const [activeTab, setActiveTab] = useState('Arithmetic');
  const lessonsRef = useRef(null);
  const pricingRef = useRef(null);

  const topics = {
    Arithmetic: ["Order of Operations", "Long Division", "Decimals", "Fractions"],
    Algebra: ["Basic Equations", "Polynomials", "Linear Functions", "Exponents"],
    Geometry: ["Angles & Degrees", "Perimeter & Area", "Pythagorean Theorem", "Polygons"]
  };

  const scrollToLessons = () => {
    lessonsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const watchDemo = () => {
    alert('Demo video would play here! This is a placeholder for the video player.');
  };

  const viewLesson = (lesson) => {
    alert(`Opening lesson: ${lesson}\n\nThis would navigate to the lesson page with video content.`);
  };

  const startFree = () => {
    alert('Redirecting to sign up page...\n\nFree account created! Welcome to MathAntics.');
  };

  const becomeMember = () => {
    alert('Redirecting to payment page...\n\nPremium membership activated! Enjoy unlimited access.');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* --- PROFESSIONAL NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <BookOpen size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">Math<span className="text-blue-600">Antics</span></span>
          </div>
          <div className="hidden md:flex gap-8 font-medium text-slate-600">
            <button onClick={scrollToLessons} className="hover:text-blue-600 transition-colors">Lessons</button>
            <button onClick={scrollToLessons} className="hover:text-blue-600 transition-colors">Exercises</button>
            <button onClick={scrollToPricing} className="hover:text-blue-600 transition-colors">Pricing</button>
            <button className="hover:text-blue-600 transition-colors">About</button>
          </div>
          <div className="flex gap-4">
            <button className="px-5 py-2 text-slate-600 font-semibold hover:text-blue-600 transition-colors">Login</button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
              Sign Up Free
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-blue-700 uppercase bg-blue-50 rounded-full">
              The Future of Math Learning
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
              Master Mathematics with <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Visual Clarity.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              We make complex math simple through high-quality video lessons, interactive exercises, and professionally designed worksheets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={scrollToLessons} className="group flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl">
                Get Started Now <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={watchDemo} className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all">
                <PlayCircle className="text-blue-600" /> Watch Demo
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* --- FEATURE SECTION (THE CORE) --- */}
      <section ref={lessonsRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold mb-4">Explore Our Lessons</h2>
              <p className="text-slate-600 text-lg">Choose a category to start your journey from basic arithmetic to advanced algebra.</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {Object.keys(topics).map((topic) => (
                <button
                  key={topic}
                  onClick={() => setActiveTab(topic)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === topic ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <motion.div 
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {topics[activeTab].map((item, idx) => (
              <motion.div 
                variants={itemVariants}
                key={idx} 
                onClick={() => viewLesson(item)}
                className="group p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-2xl hover:shadow-blue-100 hover:border-blue-200 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                  <Video size={20} />
                </div>
                <h3 className="font-bold text-lg mb-2">{item}</h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">Complete video lesson with step-by-step visual examples.</p>
                <div className="flex items-center gap-1 text-blue-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                  View Lesson <ChevronRight size={16} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-20 bg-blue-600 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-extrabold mb-2">1M+</div>
              <div className="text-blue-100 font-medium">Active Students</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold mb-2">80+</div>
              <div className="text-blue-100 font-medium">Video Lessons</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold mb-2">500+</div>
              <div className="text-blue-100 font-medium">Worksheets</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold mb-2">4.9/5</div>
              <div className="text-blue-100 font-medium">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section ref={pricingRef} className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-600">Access premium resources to accelerate your learning.</p>
        </div>
        
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-2">Free Plan</h3>
            <div className="text-4xl font-black mb-6">$0<span className="text-lg text-slate-400 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-10 text-left">
              <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-green-500" /> All Video Lessons</li>
              <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-green-500" /> Community Forums</li>
              <li className="flex items-center gap-3 text-slate-300 italic"><CheckCircle size={18} /> Downloadable Worksheets</li>
              <li className="flex items-center gap-3 text-slate-300 italic"><CheckCircle size={18} /> Answer Keys</li>
            </ul>
            <button onClick={startFree} className="w-full py-4 border-2 border-slate-900 rounded-xl font-bold hover:bg-slate-900 hover:text-white transition-all">Start for Free</button>
          </div>

          {/* Premium Tier */}
          <div className="bg-slate-900 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-6 right-6 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Best Value</div>
            <h3 className="text-xl font-bold mb-2">Full Membership</h3>
            <div className="text-4xl font-black mb-6">$20<span className="text-lg text-slate-400 font-normal">/yr</span></div>
            <ul className="space-y-4 mb-10 text-left">
              <li className="flex items-center gap-3"><CheckCircle size={18} className="text-blue-400" /> Unlimited Video Access</li>
              <li className="flex items-center gap-3"><CheckCircle size={18} className="text-blue-400" /> Interactive Exercises</li>
              <li className="flex items-center gap-3"><CheckCircle size={18} className="text-blue-400" /> PDF Worksheets & Answers</li>
              <li className="flex items-center gap-3"><CheckCircle size={18} className="text-blue-400" /> Priority Support</li>
            </ul>
            <button onClick={becomeMember} className="w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/50">Become a Member</button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-600 p-1.5 rounded text-white"><BookOpen size={18} /></div>
              <span className="text-xl font-bold">MathAntics</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">Providing high-quality math resources since 2010. Simple, engaging, and professional education for all.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Resources</h4>
            <ul className="space-y-3 text-slate-500 text-sm">
              <li className="hover:text-blue-600 cursor-pointer">Worksheets</li>
              <li className="hover:text-blue-600 cursor-pointer">Study Guides</li>
              <li className="hover:text-blue-600 cursor-pointer">Video Library</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-3 text-slate-500 text-sm">
              <li className="hover:text-blue-600 cursor-pointer">About Us</li>
              <li className="hover:text-blue-600 cursor-pointer">Support</li>
              <li className="hover:text-blue-600 cursor-pointer">Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Legal</h4>
            <ul className="space-y-3 text-slate-500 text-sm">
              <li className="hover:text-blue-600 cursor-pointer">Terms of Service</li>
              <li className="hover:text-blue-600 cursor-pointer">Privacy Policy</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EraOfMathAntics;