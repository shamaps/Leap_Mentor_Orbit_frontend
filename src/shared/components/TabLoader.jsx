// src/components/common/TabLoader.jsx
import PropTypes from "prop-types";

const TabLoader = ({ message = "Loading..." }) => (
    <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-blue-900 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">{message}</p>
        </div>
    </div>
);

TabLoader.propTypes = {
    message: PropTypes.string,
};

export default TabLoader;