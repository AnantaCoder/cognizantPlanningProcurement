import React from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  LineChart, 
  Hexagon, 
  Leaf, 
  Layers, 
  Radio, 
  Cpu, 
  Award,
  BrainCircuit,
  GitFork,
  SlidersHorizontal,
  FileText,
  RefreshCw
} from 'lucide-react';

interface HomePageProps {
  onEnter: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onEnter }) => {
  return (
    <div className="h-full w-full overflow-y-auto bg-[#F3EEE3] text-[#12161F] scroll-smooth relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Background Dot Pattern (Tailor's Pattern Paper) */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(#8B93A1 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px'
      }}></div>

      {/* 1. HERO SECTION (ASYMMETRIC) */}
      <section className="relative z-10 pt-20 pb-24 px-6 min-h-[85vh] flex flex-col justify-center max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column (Copy & CTA) */}
          <div className="lg:col-span-7 flex flex-col items-start animate-fade-in-up">
            
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-[#12161F] text-[#12161F] text-[10px] font-bold tracking-widest uppercase mb-8 bg-[#F3EEE3]">
              <Sparkles size={12} className="text-[#E3A23C]" />
              Cognizant Hackathon · Final Submission
            </div>
            
            {/* Headline (Oswald) */}
            <h1 className="text-6xl md:text-8xl font-bold uppercase leading-[1.05] tracking-tight mb-6 text-[#12161F]" style={{ fontFamily: "'Oswald', sans-serif" }}>
              TrendWear<br/>
              Planning &<br/>
              <span className="text-[#E3A23C]">Procurement</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#8B93A1] mb-12 max-w-xl leading-relaxed font-medium">
              An intelligent, unified supply chain solution addressing both S&OP Planning and 
              Procurement Risk through Machine Learning and Operations Research.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={onEnter}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#E3A23C] hover:bg-[#d19130] text-[#12161F] font-bold text-sm uppercase tracking-widest transition-all duration-300 w-full sm:w-auto shadow-[4px_4px_0px_#12161F] hover:shadow-[2px_2px_0px_#12161F] hover:translate-x-[2px] hover:translate-y-[2px]"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Enter Dashboard 
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => document.getElementById('problem-statements')?.scrollIntoView()}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-[#12161F] text-[#12161F] hover:bg-[#12161F] hover:text-[#F3EEE3] font-bold text-sm uppercase tracking-widest transition-all duration-300 w-full sm:w-auto shadow-[4px_4px_0px_rgba(18,22,31,0.2)] hover:shadow-[2px_2px_0px_rgba(18,22,31,0.2)] hover:translate-x-[2px] hover:translate-y-[2px]"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Explore Tracks
              </button>
            </div>
          </div>

          {/* Right Column (Hanging Tag / KPIs) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end animate-fade-in-up mt-16 lg:mt-0" style={{ animationDelay: '0.2s' }}>
            <div className="relative w-full max-w-sm">
              
              {/* String */}
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-0.5 h-32 bg-[#8B93A1] opacity-60 z-0 origin-top animate-swing"></div>
              
              {/* The Tag */}
              <div className="relative z-10 bg-[#F3EEE3] border-2 border-[#12161F] shadow-[12px_12px_0px_rgba(18,22,31,0.1)] p-2 origin-top animate-swing-slow">
                <div className="border border-dashed border-[#8B93A1] p-8 h-full flex flex-col relative bg-[#F3EEE3]">
                  
                  {/* Grommet Hole */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#F3EEE3] rounded-full border-2 border-[#12161F] flex items-center justify-center shadow-inner">
                    <div className="w-3 h-3 rounded-full bg-[#12161F]"></div>
                  </div>

                  <div className="text-center mb-6 mt-2">
                    <div className="text-[#8B93A1] text-[10px] tracking-widest uppercase font-bold mb-1">Manifest // Final Spec</div>
                    <div className="w-full h-px bg-[#12161F] opacity-20 mt-2"></div>
                  </div>

                  <div className="mb-6">
                    <div className="text-[9px] uppercase tracking-widest text-[#12161F] font-bold mb-2">Core Challenges Addressed</div>
                    <ul className="text-[#8B93A1] text-[10px] leading-relaxed list-disc pl-3 space-y-1.5 font-medium">
                      <li>Siloed Demand & Supply Planning</li>
                      <li>Unpredicted Supplier Delays & Risks</li>
                      <li>Suboptimal Order Allocations</li>
                    </ul>
                  </div>

                  <div className="w-full h-px bg-[#12161F] opacity-10 mb-6"></div>

                  <div className="space-y-6">
                    {/* Spec 1 */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-[#8B93A1] font-bold mb-1">Primary Objective</div>
                      <div className="text-xl font-medium text-[#12161F]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        Cost & Risk Balance
                      </div>
                    </div>
                    
                    {/* Spec 2 */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-[#8B93A1] font-bold mb-1">Optimization Engine</div>
                      <div className="text-xl font-medium text-[#E3A23C]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        Linear Programming
                      </div>
                    </div>

                    {/* Spec 3 */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-[#8B93A1] font-bold mb-1">Predictive AI</div>
                      <div className="text-xl font-medium text-[#12161F]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        Disruption ML Model
                      </div>
                    </div>

                    {/* Spec 4 */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-[#8B93A1] font-bold mb-1">Deployment Scope</div>
                      <div className="text-xl font-medium text-[#12161F]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        E2E S&OP Lifecycle
                      </div>
                    </div>
                  </div>

                  {/* Barcode representation */}
                  <div className="mt-10 flex justify-between h-8 opacity-40">
                    <div className="w-1 h-full bg-[#12161F]"></div>
                    <div className="w-2 h-full bg-[#12161F]"></div>
                    <div className="w-0.5 h-full bg-[#12161F]"></div>
                    <div className="w-1.5 h-full bg-[#12161F]"></div>
                    <div className="w-3 h-full bg-[#12161F]"></div>
                    <div className="w-1 h-full bg-[#12161F]"></div>
                    <div className="w-0.5 h-full bg-[#12161F]"></div>
                    <div className="w-2 h-full bg-[#12161F]"></div>
                    <div className="w-1 h-full bg-[#12161F]"></div>
                    <div className="w-1.5 h-full bg-[#12161F]"></div>
                    <div className="w-2 h-full bg-[#12161F]"></div>
                    <div className="w-0.5 h-full bg-[#12161F]"></div>
                    <div className="w-1 h-full bg-[#12161F]"></div>
                  </div>
                  <div className="text-center mt-1 text-[8px] tracking-[0.2em] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    TRND-P2-PR1-2026
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM STATEMENTS SECTION (INDUSTRIAL THEME) */}
      <section id="problem-statements" className="relative z-10 py-24 px-6 bg-[#12161F] text-[#F3EEE3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[10px] font-bold tracking-widest text-[#8B93A1] uppercase mb-4 border-b border-[#8B93A1]/30 pb-4 inline-block">
              Two Problem Statements · One Platform
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Planning & Procurement<br/>
              <span className="text-[#E3A23C]">Solved Together</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* P2 Card */}
            <div className="bg-[#12161F] border-2 border-[#8B93A1]/30 p-2 hover:border-[#E3A23C] transition-colors duration-500 group">
              <div className="border border-dashed border-[#8B93A1]/40 p-8 h-full bg-[#12161F]">
                <div className="flex items-center justify-between border-b border-[#8B93A1]/30 pb-4 mb-6">
                  <div className="text-[12px] font-bold tracking-widest text-[#8B93A1] uppercase">P 2</div>
                  <LineChart className="text-[#8B93A1] group-hover:text-[#E3A23C] transition-colors duration-500" size={24} />
                </div>
                
                <h3 className="text-3xl font-bold uppercase mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>Planning</h3>
                
                <p className="text-[#8B93A1] leading-relaxed mb-8 min-h-[80px]">
                  Integrated S&OP for TrendWear Apparel. Reconciling merchandising 
                  forecasts with plant capacity, recommending markdown timing via ML, 
                  and building a rolling 12-week monthly S&OP cycle.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-[#F3EEE3] text-[#12161F]">
                    Demand Sensing
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-[#F3EEE3] text-[#12161F]">
                    Markdown Optimization
                  </span>
                </div>
              </div>
            </div>

            {/* PR1 Card */}
            <div className="bg-[#12161F] border-2 border-[#8B93A1]/30 p-2 hover:border-[#B5482F] transition-colors duration-500 group">
              <div className="border border-dashed border-[#8B93A1]/40 p-8 h-full bg-[#12161F]">
                <div className="flex items-center justify-between border-b border-[#8B93A1]/30 pb-4 mb-6">
                  <div className="text-[12px] font-bold tracking-widest text-[#8B93A1] uppercase">PR 1</div>
                  <Hexagon className="text-[#8B93A1] group-hover:text-[#B5482F] transition-colors duration-500" size={24} />
                </div>
                
                <h3 className="text-3xl font-bold uppercase mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>Procurement</h3>
                
                <p className="text-[#8B93A1] leading-relaxed mb-8 min-h-[80px]">
                  Procurement Planning & Supplier Allocation Automation. Minimizing total 
                  cost while meeting demand constraints (MOQs), reducing dependency on 
                  high-risk suppliers, and predicting delays before PO release.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-[#F3EEE3] text-[#12161F]">
                    XGBoost Risk AI
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-[#F3EEE3] text-[#12161F]">
                    MILP Solver
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PIPELINE FOOTER */}
      <footer className="bg-[#12161F] text-[#F3EEE3] py-20 px-6 relative border-t border-[#8B93A1]/20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-[10px] font-bold tracking-widest text-[#8B93A1] uppercase mb-4">
            Process Flow
          </div>
          <h2 className="text-4xl font-bold uppercase mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
            The Full <span className="text-[#E3A23C]">Pipeline</span>
          </h2>
          <p className="text-sm text-[#8B93A1] mb-12 max-w-lg mx-auto">
            From raw signal to released purchase order — the full journey our platform automates.
          </p>

          {/* High-Level Horizontal Tracker */}
          <div className="max-w-5xl mx-auto flex items-center justify-between mb-24 px-4 opacity-80 hidden md:flex">
             <div className="text-center w-40">
                <div className="text-[#F3EEE3] text-[11px] font-bold uppercase tracking-wider">Demand & S&OP Planning</div>
             </div>
             
             <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#8B93A1]/30 to-transparent mx-2 relative">
               <ArrowRight size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8B93A1]/50" />
             </div>
             
             <div className="text-center w-44">
                <div className="text-[#F3EEE3] text-[11px] font-bold uppercase tracking-wider">Material Requirements Intel</div>
             </div>

             <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#8B93A1]/30 to-transparent mx-2 relative">
               <ArrowRight size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8B93A1]/50" />
             </div>
             
             <div className="text-center w-48">
                <div className="text-[#F3EEE3] text-[11px] font-bold uppercase tracking-wider">Supplier Risk Identification</div>
             </div>

             <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#8B93A1]/30 to-transparent mx-2 relative">
               <ArrowRight size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8B93A1]/50" />
             </div>
             
             <div className="text-center w-52">
                <div className="text-[#F3EEE3] text-[11px] font-bold uppercase tracking-wider">Optimal Supplier Allocation</div>
             </div>

             <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#8B93A1]/30 to-transparent mx-2 relative">
               <ArrowRight size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8B93A1]/50" />
             </div>
             
             <div className="text-center w-48">
                <div className="text-[#F3EEE3] text-[11px] font-bold uppercase tracking-wider">Purchase Order Execution</div>
             </div>
          </div>

          <div className="max-w-2xl mx-auto text-left relative">
            
            {/* 1 */}
            <div className="flex gap-6 relative pb-12 group">
              <div className="absolute top-14 left-7 w-[2px] h-full bg-[#8B93A1]/20 group-hover:bg-[#E3A23C]/50 transition-colors duration-500"></div>
              <div className="relative z-10 w-14 h-14 shrink-0 rounded-full border-2 border-[#8B93A1]/50 bg-[#12161F] flex items-center justify-center group-hover:border-[#E3A23C] group-hover:text-[#E3A23C] text-[#8B93A1] transition-all duration-300 shadow-md">
                <Radio size={24} />
              </div>
              <div className="pt-3">
                <h3 className="text-2xl font-bold uppercase mb-2 text-[#F3EEE3] group-hover:text-[#E3A23C] transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>Demand Signal</h3>
                <p className="text-[#8B93A1] text-sm leading-relaxed">Forecasting SKU & Plant Requirements. Merging historical sales with future indicators to determine exact needs.</p>
              </div>
            </div>

            {/* 2 */}
            <div className="flex gap-6 relative pb-12 group">
              <div className="absolute top-14 left-7 w-[2px] h-full bg-[#8B93A1]/20 group-hover:bg-[#E3A23C]/50 transition-colors duration-500"></div>
              <div className="relative z-10 w-14 h-14 shrink-0 rounded-full border-2 border-[#8B93A1]/50 bg-[#12161F] flex items-center justify-center group-hover:border-[#E3A23C] group-hover:text-[#E3A23C] text-[#8B93A1] transition-all duration-300 shadow-md">
                <Cpu size={24} />
              </div>
              <div className="pt-3">
                <h3 className="text-2xl font-bold uppercase mb-2 text-[#F3EEE3] group-hover:text-[#E3A23C] transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>Procurement Intel</h3>
                <p className="text-[#8B93A1] text-sm leading-relaxed">Calculating Net Requirement & Timing. Translating demand plans into actionable raw material needs.</p>
              </div>
            </div>

            {/* 3 */}
            <div className="flex gap-6 relative pb-12 group">
              <div className="absolute top-14 left-7 w-[2px] h-full bg-[#8B93A1]/20 group-hover:bg-[#E3A23C]/50 transition-colors duration-500"></div>
              <div className="relative z-10 w-14 h-14 shrink-0 rounded-full border-2 border-[#8B93A1]/50 bg-[#12161F] flex items-center justify-center group-hover:border-[#E3A23C] group-hover:text-[#E3A23C] text-[#8B93A1] transition-all duration-300 shadow-md">
                <Award size={24} />
              </div>
              <div className="pt-3">
                <h3 className="text-2xl font-bold uppercase mb-2 text-[#F3EEE3] group-hover:text-[#E3A23C] transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>Supplier Evaluation</h3>
                <p className="text-[#8B93A1] text-sm leading-relaxed">Multi-Criteria Scoring of suppliers. Assessing historical performance, cost variability, and lead times.</p>
              </div>
            </div>

            {/* 4 */}
            <div className="flex gap-6 relative pb-12 group">
              <div className="absolute top-14 left-7 w-[2px] h-full bg-[#8B93A1]/20 group-hover:bg-[#E3A23C]/50 transition-colors duration-500"></div>
              <div className="relative z-10 w-14 h-14 shrink-0 rounded-full border-2 border-[#8B93A1]/50 bg-[#12161F] flex items-center justify-center group-hover:border-[#E3A23C] group-hover:text-[#E3A23C] text-[#8B93A1] transition-all duration-300 shadow-md">
                <BrainCircuit size={24} />
              </div>
              <div className="pt-3">
                <h3 className="text-2xl font-bold uppercase mb-2 text-[#F3EEE3] group-hover:text-[#E3A23C] transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>AI Risk Prediction</h3>
                <p className="text-[#8B93A1] text-sm leading-relaxed">ML Disruption & Delay forecasting. Predicting the likelihood of supplier failure using XGBoost models.</p>
              </div>
            </div>

            {/* 5 */}
            <div className="flex gap-6 relative pb-12 group">
              <div className="absolute top-14 left-7 w-[2px] h-full bg-[#8B93A1]/20 group-hover:bg-[#E3A23C]/50 transition-colors duration-500"></div>
              <div className="relative z-10 w-14 h-14 shrink-0 rounded-full border-2 border-[#8B93A1]/50 bg-[#12161F] flex items-center justify-center group-hover:border-[#E3A23C] group-hover:text-[#E3A23C] text-[#8B93A1] transition-all duration-300 shadow-md">
                <GitFork size={24} />
              </div>
              <div className="pt-3">
                <h3 className="text-2xl font-bold uppercase mb-2 text-[#F3EEE3] group-hover:text-[#E3A23C] transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>Multi-Objective Allocation</h3>
                <p className="text-[#8B93A1] text-sm leading-relaxed">PuLP Linear Optimizer. Balancing total cost minimization with AI risk scores to generate optimal order splits.</p>
              </div>
            </div>

            {/* 6 */}
            <div className="flex gap-6 relative pb-12 group">
              <div className="absolute top-14 left-7 w-[2px] h-full bg-[#8B93A1]/20 group-hover:bg-[#B5482F]/50 transition-colors duration-500"></div>
              <div className="relative z-10 w-14 h-14 shrink-0 rounded-full border-2 border-[#8B93A1]/50 bg-[#12161F] flex items-center justify-center group-hover:border-[#B5482F] group-hover:text-[#B5482F] text-[#8B93A1] transition-all duration-300 shadow-md">
                <SlidersHorizontal size={24} />
              </div>
              <div className="pt-3">
                <h3 className="text-2xl font-bold uppercase mb-2 text-[#F3EEE3] group-hover:text-[#B5482F] transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>Scenario Simulation</h3>
                <p className="text-[#8B93A1] text-sm leading-relaxed">Disruption & Spike Testing. Stress-testing allocations against simulated geopolitical or climate events.</p>
              </div>
            </div>

            {/* 7 */}
            <div className="flex gap-6 relative pb-12 group">
              <div className="absolute top-14 left-7 w-[2px] h-full bg-[#8B93A1]/20 group-hover:bg-[#B5482F]/50 transition-colors duration-500"></div>
              <div className="relative z-10 w-14 h-14 shrink-0 rounded-full border-2 border-[#8B93A1]/50 bg-[#12161F] flex items-center justify-center group-hover:border-[#B5482F] group-hover:text-[#B5482F] text-[#8B93A1] transition-all duration-300 shadow-md">
                <FileText size={24} />
              </div>
              <div className="pt-3">
                <h3 className="text-2xl font-bold uppercase mb-2 text-[#F3EEE3] group-hover:text-[#B5482F] transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>Purchase Orders</h3>
                <p className="text-[#8B93A1] text-sm leading-relaxed">Risk-Flagged PO Generation. Exporting final, optimized supplier orders directly to the ERP.</p>
              </div>
            </div>

            {/* 8 */}
            <div className="flex gap-6 relative group">
              <div className="relative z-10 w-14 h-14 shrink-0 rounded-full border-2 border-[#8B93A1]/50 bg-[#12161F] flex items-center justify-center group-hover:border-[#3B82F6] group-hover:text-[#3B82F6] text-[#8B93A1] transition-all duration-300 shadow-md">
                <RefreshCw size={24} className="group-hover:animate-spin-slow" />
              </div>
              <div className="pt-3">
                <h3 className="text-2xl font-bold uppercase mb-2 text-[#F3EEE3] group-hover:text-[#3B82F6] transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>Feedback Loop</h3>
                <p className="text-[#8B93A1] text-sm leading-relaxed">Continuous Learning: Actuals ➔ Risk Model Update. The system perpetually refines its ML predictions based on real-world outcomes.</p>
              </div>
            </div>

          </div>
        </div>
      </footer>

      {/* 4. COPYRIGHT */}
      <div className="bg-[#12161F] text-[#8B93A1] py-8 text-center text-[10px] uppercase tracking-[0.2em] font-medium border-t border-[#8B93A1]/10" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        TrendWear Spec Sheet · Cognizant Hackathon · Final
      </div>
      
      {/* Global CSS for custom animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        @keyframes swing {
          0% { transform: rotate(1deg); }
          50% { transform: rotate(-1deg); }
          100% { transform: rotate(1deg); }
        }
        .animate-swing {
          animation: swing 6s ease-in-out infinite;
        }
        .animate-swing-slow {
          animation: swing 6s ease-in-out infinite;
          transform-origin: top center;
        }
      `}} />
    </div>
  );
};
