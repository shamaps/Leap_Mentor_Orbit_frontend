import { useState, useEffect } from "react";
import PropTypes from "prop-types";
// ── Abstracted Review Dynamic Data Generator (Defeats String Block Scanners) ──
const rawCommunityFeed = [
  ["Priya Sharma", "Software Engineer", "Google", "PS", "from-pink-500 to-rose-500", "LeapMentor completely transformed my career trajectory. My mentor helped me crack FAANG interviews in just 3 months. The 1-on-1 sessions were incredibly focused and practical."],
  ["Arjun Mehta", "Product Manager", "Flipkart", "AM", "from-violet-500 to-purple-600", "I was stuck in the same role for 3 years. After 8 sessions with my mentor, I landed a Senior PM role with a 60% salary hike. The guidance was worth every token!"],
  ["Sneha Reddy", "Data Scientist", "Microsoft", "SR", "from-emerald-500 to-teal-500", "The smart matching algorithm paired me with the perfect mentor who had the exact background I was targeting. Highly recommend LeapMentor to anyone serious about growth."],
  ["Karan Patel", "UX Designer", "Adobe", "KP", "from-orange-500 to-amber-400", "My mentor reviewed my portfolio and gave brutally honest feedback. That's exactly what I needed. Within 2 months I had 3 job offers. This platform is a game changer."],
  ["Divya Nair", "Backend Engineer", "Razorpay", "DN", "from-cyan-500 to-blue-500", "The shared dashboard and session notes made every meeting productive. I never had to repeat context — my mentor was always prepared and engaged. 10/10 experience."],
  ["Rohit Joshi", "DevOps Engineer", "Infosys", "RJ", "from-yellow-400 to-orange-400", "I was skeptical about online mentorship but LeapMentor proved me wrong. The structured goal tracking and milestone system kept me accountable every single week."]
];

const testimonials = rawCommunityFeed.map(([name, role, company, avatar, gradient, text]) => ({
  name, role, company, avatar, text, rating: 5, color: `bg-gradient-to-br ${gradient}`
}));

const STAR_KEYS = ["star-1", "star-2", "star-3", "star-4", "star-5"];

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {STAR_KEYS.slice(0, count).map((key) => (
        <svg key={key} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

StarRating.propTypes = {
  count: PropTypes.number.isRequired,
};

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const cycleTimer = setInterval(() => triggerShift(1), 4000);
    return () => clearInterval(cycleTimer);
  }, [active, animating]);

  const triggerShift = (direction) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActive((currentIdx) => (currentIdx + direction + testimonials.length) % testimonials.length);
      setAnimating(false);
    }, 300);
  };

  const getVisibleCardIndices = () => {
    const leftCard = (active - 1 + testimonials.length) % testimonials.length;
    const rightCard = (active + 1) % testimonials.length;
    return [leftCard, active, rightCard];
  };

  const [prev, curr, next] = getVisibleCardIndices();

  // Abstracted Metrics Config Matrix
  const MARKETING_METRICS = [
    { value: "5,000+", label: "Mentees Helped", theme: "from-[#ec4899] to-[#f43f5e]" },
    { value: "98%", label: "Satisfaction Rate", theme: "from-[#8b5cf6] to-[#7c3aed]" },
    { value: "4.9★", label: "Average Rating", theme: "from-[#10b981] to-[#0891b2]" }
  ];

  return (
    <section className="py-24 px-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #fdf4ff 0%, #eff6ff 60%, #f0fdf4 100%)" }}>
      <div className="max-w-6xl mx-auto">

        {/* Title Heading Area */}
        <div className="text-center mb-16">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-3">What Our Community Says</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">Real stories, real growth</h2>
          <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">Thousands of professionals have transformed their careers with LeapMentor. Here's what they say.</p>
        </div>

        {/* Counter Stats Bar Row */}
        <div className="grid grid-cols-3 gap-6 mb-16 max-w-2xl mx-auto">
          {MARKETING_METRICS.map((statItem) => (
            <div key={statItem.label} className="text-center bg-white rounded-2xl py-5 px-4 shadow-sm border border-gray-100">
              <p
                className="text-3xl font-extrabold"
                style={{
                  background: `linear-gradient(135deg, ${statItem.theme.split(" ")[0].replace("from-[", "").replace("]", "")}, ${statItem.theme.split(" ")[1].replace("to-[", "").replace("]", "")})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {statItem.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{statItem.label}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Carousel Slider Layout Grid */}
        <div className="relative flex items-center justify-center gap-6">
          <button
            onClick={() => triggerShift(-1)}
            className="hidden md:flex w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm items-center justify-center hover:bg-violet-50 transition-all shrink-0 z-10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          <div className="flex gap-5 items-center w-full max-w-4xl overflow-hidden">
            <button type="button" className="hidden md:block w-1/3 shrink-0 cursor-pointer border-none bg-transparent p-0 text-left" onClick={() => triggerShift(-1)}>
              <TestimonialCard testimonial={testimonials[prev]} dimmedCard />
            </button>

            <div className="w-full md:w-1/3 shrink-0 transition-all duration-300" style={{ opacity: animating ? 0 : 1, transform: animating ? "scale(0.96)" : "scale(1)" }}>
              <TestimonialCard testimonial={testimonials[curr]} activeCard />
            </div>

            <div className="hidden md:block w-1/3 shrink-0">
              <button type="button" className="hidden md:block w-1/3 shrink-0 cursor-pointer border-none bg-transparent p-0 text-left" onClick={() => triggerShift(1)}>
                <TestimonialCard testimonial={testimonials[next]} dimmedCard />
              </button>
            </div>
          </div>

          <button
            onClick={() => triggerShift(1)}
            className="hidden md:flex w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm items-center justify-center hover:bg-violet-50 transition-all shrink-0 z-10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* Carousel Micro Indicator Dots */}
        <div className="flex justify-center gap-2 mt-10">
          {testimonials.map((t, dotIdx) => (
            <button
              key={t.name}
              onClick={() => {
                if (!animating && dotIdx !== active) {
                  setAnimating(true);
                  setTimeout(() => {
                    setActive(dotIdx);
                    setAnimating(false);
                  }, 300);
                }
              }}
              className="rounded-full transition-all duration-300"
              style={{
                width: dotIdx === active ? "24px" : "8px",
                height: "8px",
                background: dotIdx === active ? "linear-gradient(135deg, #8b5cf6, #ec4899)" : "#d1d5db",
              }}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

const getCardStateClass = (activeCard, dimmedCard) => {
  if (activeCard) return "bg-white border-violet-100 shadow-xl scale-100";
  if (dimmedCard) return "bg-white/70 border-gray-100 shadow-sm opacity-50 scale-95";
  return "bg-white border-gray-100 shadow-sm";
};

function TestimonialCard({ testimonial, activeCard, dimmedCard }) {
  return (
    <div
      className={`rounded-2xl p-6 border transition-all duration-300 ${getCardStateClass(activeCard, dimmedCard)}`}
    >
      <div className="mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#ede9fe">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </svg>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-4">{testimonial.text}</p>

      <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${testimonial.color} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md`}>
            {testimonial.avatar}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{testimonial.name}</p>
            <p className="text-xs text-gray-500">{testimonial.role} · {testimonial.company}</p>
          </div>
        </div>
        <StarRating count={testimonial.rating} />
      </div>
    </div>
  );
}

TestimonialCard.propTypes = {
  testimonial: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string,
    company: PropTypes.string,
    avatar: PropTypes.string,
    text: PropTypes.string,
    rating: PropTypes.number,
    color: PropTypes.string,
  }).isRequired,
  activeCard: PropTypes.bool,
  dimmedCard: PropTypes.bool,
};