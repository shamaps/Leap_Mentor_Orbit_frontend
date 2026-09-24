// src/components/common/FilterTabs.jsx
interface FilterTabsProps {
    options: string[];
    active: string;
    onChange: (option: string) => void;
    activeColor?: string;
}

const FilterTabs = ({ options, active, onChange, activeColor = "#2563eb" }: FilterTabsProps) => (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {options.map((opt: string) => {
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

export default FilterTabs;