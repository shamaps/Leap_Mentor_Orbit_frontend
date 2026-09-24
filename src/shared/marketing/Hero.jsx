import { useState, useEffect } from "react";

const images = [
  "/images/mentor3.webp",
  "/images/mentor4.webp",
  "/images/mentor2.webp",
];
const advanceSlide = (prev) => (prev + 1) % images.length;
export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent(advanceSlide);
        setFade(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const getSlideOpacity = (current, i, fade) => (current === i && fade ? 1 : 0);
  return (
    <section className="min-h-screen bg-white pt-24 pb-16 px-6 flex items-center">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="flex flex-col gap-6">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Empower Your <br />
            Growth with <span className="text-blue-900">Expert Mentorship</span>
          </h1>

          <p className="text-gray-500 text-lg leading-relaxed max-w-md">
            Leapmentor connects ambitious professionals with industry leaders.
            Get personalized guidance, master new skills, and accelerate your
            career path with 1-on-1 sessions.
          </p>

          {/* Social Proof */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex -space-x-2">
              {["bg-pink-400", "bg-yellow-400", "bg-green-400"].map((color, i) => (
                <div
                  key={color}
                  className={`w-9 h-9 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                >
                  {["A", "B", "C"][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Joined by{" "}
              <span className="font-semibold text-gray-800">5,000+</span>{" "}
              mentees this month
            </p>
          </div>
        </div>

        {/* Right — Auto Image Slider */}
        <div className="relative flex justify-center">
          <div className="w-full max-w-md h-80 md:h-96 rounded-3xl overflow-hidden shadow-2xl relative bg-blue-50">
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Slide ${i + 1}`}
                width={896}
                height={768}
                // First image: high priority + eager, rest: lazy + low priority
                fetchPriority={i === 0 ? "high" : "low"}
                loading={i === 0 ? "eager" : "lazy"}
                decoding={i === 0 ? "sync" : "async"}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: getSlideOpacity(current, i, fade),           
                  transition:
                    current === i && fade ? "opacity 0.4s ease-in-out" : "none",
                }}
              />
            ))}

            {/* Subtle overlay gradient */}
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />

            {/* Floating Success Card */}
            <div className="absolute bottom-6 right-4 bg-white rounded-2xl shadow-xl p-4 w-52 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="#16A34A"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Success Rate
                  </p>
                  <p className="text-2xl font-extrabold text-gray-900 leading-none">
                    98%
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Mentee satisfaction rise across all verified programs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
