// src/components/common/FilterTabs.jsx
import PropTypes from "prop-types";

const FilterTabs = ({ options, active, onChange, activeColor = "#2563eb" }) => (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {options.map((opt) => {
            const isActive = active === opt;
            return (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    style={{
                        padding: "6px 18px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "1.5px solid",
                        borderColor: isActive ? activeColor : "#e2e8f0",
                        background: isActive ? activeColor : "#fff",
                        color: isActive ? "#fff" : "#475569",
                        textTransform: "capitalize",
                        transition: "all 0.15s",
                    }}
                >
                    {opt}
                </button>
            );
        })}
    </div>
);

FilterTabs.propTypes = {
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
    active: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    activeColor: PropTypes.string,
};

export default FilterTabs;