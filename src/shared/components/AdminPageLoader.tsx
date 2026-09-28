// shared/components/AdminPageLoader.tsx
const AdminPageLoader = () => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f172a" }}>
        <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full border-4 border-blue-900 border-t-blue-500 animate-spin" />
            <p className="text-xs text-slate-500">Loading admin dashboard...</p>
        </div>
    </div>
);

export default AdminPageLoader;