import React from 'react';
import { Users, Target, Award, Heart, ShieldCheck, MapPin } from 'lucide-react';

const About = () => {
  return (
    <div className="about-page section-padding fade-in">
      <div className="container">
        {/* Header Section */}
        <div className="text-center mb-16">
          <span className="badge">Our Story</span>
          <h2>A Culinary Journey of <span>Passion</span></h2>
          <p className="max-width-700 mx-auto mt-4 text-lg">Founded in 2020, GourmetGo started with a simple belief: that everyone deserves to experience the authentic, rich flavors of Pakistan and the world, crafted with care and delivered with love.</p>
        </div>

        {/* Story Section */}
        <div className="about-grid grid gap-16 items-center">
          <div className="about-image">
            <div className="image-frame">
              <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200" alt="Restaurant Interior" />
              <div className="experience-badge">
                <span className="years">5+</span>
                <span className="label">Years of Excellence</span>
              </div>
            </div>
          </div>
          <div className="about-content">
            <h3>More Than Just a <span>Restaurant</span></h3>
            <p>Our journey began in a small kitchen in Lahore, where we experimented with traditional family recipes and global culinary trends. We wanted to create a bridge between heritage and modern gastronomy.</p>
            <p>Every dish at GourmetGo is a masterpiece, prepared by our master chefs who bring decades of expertise to the table. We don't just sell food; we serve memories, traditions, and the joy of shared meals.</p>
            
            <div className="features-small grid gap-6 mt-8">
              <div className="small-feature flex items-center gap-4">
                <div className="icon-sm"><ShieldCheck size={20} /></div>
                <div>
                  <h4>Certified Hygiene</h4>
                  <p>A+ Grade by Punjab Food Authority</p>
                </div>
              </div>
              <div className="small-feature flex items-center gap-4">
                <div className="icon-sm"><Heart size={20} /></div>
                <div>
                  <h4>Made with Love</h4>
                  <p>Hand-crafted recipes using organic ingredients</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row grid gap-8 mt-24">
          <div className="stat-card">
            <Users size={32} />
            <h4>50k+</h4>
            <p>Happy Foodies</p>
          </div>
          <div className="stat-card">
            <MapPin size={32} />
            <h4>8</h4>
            <p>Cities Covered</p>
          </div>
          <div className="stat-card">
            <Award size={32} />
            <h4>12</h4>
            <p>Culinary Awards</p>
          </div>
          <div className="stat-card">
            <Target size={32} />
            <h4>100%</h4>
            <p>Halal Certified</p>
          </div>
        </div>

        {/* Mission Quote */}
        <section className="mission-quote mt-24">
          <div className="quote-box">
            <p>"Our mission is to bring the soul of Pakistani hospitality to every doorstep, ensuring that quality and taste are never compromised."</p>
            <div className="founder-info flex items-center justify-center gap-4 mt-8">
              <div className="founder-avatar"></div>
              <div className="text-left">
                <h5>Ali Ahmed</h5>
                <p>Founder & CEO</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .badge { display: inline-block; padding: 0.5rem 1rem; background: var(--accent); color: var(--primary); border-radius: 50px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
        .text-lg { font-size: 1.25rem; line-height: 1.6; }
        .mt-4 { margin-top: 1rem; }
        .mt-8 { margin-top: 2rem; }
        .mt-16 { margin-top: 4rem; }
        .mt-24 { margin-top: 6rem; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .max-width-700 { max-width: 700px; }

        .about-grid { grid-template-columns: 1fr 1fr; }
        .image-frame { position: relative; padding-right: 2rem; padding-bottom: 2rem; }
        .image-frame img { width: 100%; border-radius: 2.5rem; box-shadow: 0 30px 60px rgba(0,0,0,0.15); }
        .experience-badge { position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; padding: 2rem; border-radius: 2rem; display: flex; flex-direction: column; align-items: center; box-shadow: 0 15px 30px rgba(249, 115, 22, 0.3); }
        .experience-badge .years { font-size: 2.5rem; font-weight: 800; line-height: 1; }
        .experience-badge .label { font-size: 0.8rem; font-weight: 600; text-align: center; margin-top: 0.5rem; }

        .about-content h3 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; line-height: 1.2; }
        .about-content h3 span { color: var(--primary); }
        .about-content p { color: var(--text-muted); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem; }
        
        .icon-sm { width: 48px; height: 48px; background: var(--accent); color: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .small-feature h4 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .small-feature p { font-size: 0.9rem; margin-bottom: 0; }

        .stats-row { grid-template-columns: repeat(4, 1fr); }
        .stat-card { background: white; padding: 3rem 1.5rem; border-radius: 2rem; text-align: center; border: 1px solid var(--border); transition: var(--transition); }
        .stat-card:hover { transform: translateY(-10px); border-color: var(--primary); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        .stat-card h4 { font-size: 2rem; font-weight: 800; margin: 1rem 0 0.5rem; color: var(--text-main); }
        .stat-card p { font-weight: 700; font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted); }

        .quote-box { background: #111827; color: white; padding: 6rem 4rem; border-radius: 3rem; text-align: center; position: relative; overflow: hidden; }
        .quote-box p { font-size: 2rem; font-weight: 500; font-style: italic; line-height: 1.4; max-width: 900px; margin: 0 auto; opacity: 0.9; }
        .founder-avatar { width: 60px; height: 60px; border-radius: 50%; background: var(--primary); background-image: url('https://i.pravatar.cc/150?u=ali'); background-size: cover; border: 3px solid white; }
        .founder-info h5 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.1rem; }
        .founder-info p { font-size: 0.9rem; font-weight: 600; color: var(--primary); opacity: 1; margin: 0; }

        @media (max-width: 1024px) {
          .about-grid { grid-template-columns: 1fr; }
          .stats-row { grid-template-columns: 1fr 1fr; }
          .quote-box p { font-size: 1.5rem; }
        }
        @media (max-width: 640px) {
          .stats-row { grid-template-columns: 1fr; }
          .quote-box { padding: 4rem 2rem; }
        }
      `}</style>
    </div>
  );
};

export default About;
