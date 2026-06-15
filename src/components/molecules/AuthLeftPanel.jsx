// src/components/molecules/AuthLeftPanel.jsx
import PropTypes from "prop-types";
const AuthLeftPanel = ({ imageSrc, imageAlt, badge, heading, subtext, stats = [] }) => {
    return (
        <div className="relative hidden lg:flex lg:w-[48%] flex-col justify-end overflow-hidden bg-slate-900">
            <img
                src={imageSrc}
                alt={imageAlt}
                className="absolute inset-0 w-full h-full object-cover object-top"
                onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-slate-900/10" />

            <div className="relative z-10 p-12 text-white">
                {badge && (
                    <div className="inline-block mb-5 px-4 py-1.5 rounded-full text-xs font-medium text-white/90 bg-white/10 border border-white/20 backdrop-blur-sm">
                        {badge}
                    </div>
                )}

                <h2 className="text-4xl font-bold leading-tight tracking-tight mb-4">
                    {heading}
                </h2>

                <p className="text-base text-white/70 leading-relaxed mb-8">
                    {subtext}
                </p>

                {stats.length > 0 && (
                    <div className="flex gap-3">
                        {stats.map(({ num, label }) => (
                            <div
                                key={label}
                                className="flex flex-col gap-0.5 px-4 py-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm"
                            >
                                <span className="text-xl font-bold">{num}</span>
                                <span className="text-[11px] uppercase tracking-wide text-white/60">{label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
AuthLeftPanel.propTypes = {
    imageSrc: PropTypes.string.isRequired,
    imageAlt: PropTypes.string.isRequired,
    badge: PropTypes.string,
    heading: PropTypes.string.isRequired,
    subtext: PropTypes.string,
    stats: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            label: PropTypes.string,
        })
    ),
};

export default AuthLeftPanel;