// src/pages/MentorMatchmaking.jsx
import { useState } from "react";

const mentorsData = [
  {
    name: "Alice Johnson",
    rating: 4.9,
    skills: ["ReactJS", "Seed Funding", "UI/UX Design"],
    badge: "Top Mentor",
    hourlyRate: 50,
    industry: "Tech",
  },
  {
    name: "Bob Smith",
    rating: 4.7,
    skills: ["Corporate Tax", "Finance Strategy"],
    badge: "Expert Mentor",
    hourlyRate: 70,
    industry: "Finance",
  },
  {
    name: "Clara Lee",
    rating: 5,
    skills: ["AI Architecture", "ReactJS Architecture"],
    badge: "Star Mentor",
    hourlyRate: 100,
    industry: "Tech",
  },
  {
    name: "David Kim",
    rating: 4.6,
    skills: ["Marketing Strategy", "Branding"],
    badge: "Marketing Guru",
    hourlyRate: 60,
    industry: "Marketing",
  },
  {
    name: "Eva Green",
    rating: 4.8,
    skills: ["Corporate Law", "Contract Drafting"],
    badge: "Legal Expert",
    hourlyRate: 90,
    industry: "Legal",
  },
  {
    name: "Frank Liu",
    rating: 4.5,
    skills: ["Blockchain", "FinTech Innovation"],
    badge: "Blockchain Mentor",
    hourlyRate: 120,
    industry: "Tech",
  },
  {
    name: "Grace Chen",
    rating: 4.9,
    skills: ["UI/UX Design", "Product Strategy"],
    badge: "Design Leader",
    hourlyRate: 80,
    industry: "Tech",
  },
  {
    name: "Hannah Brown",
    rating: 4.4,
    skills: ["Investment Banking", "Finance Modeling"],
    badge: "Finance Mentor",
    hourlyRate: 110,
    industry: "Finance",
  },
  {
    name: "Ian Scott",
    rating: 4.7,
    skills: ["Social Media Marketing", "SEO"],
    badge: "Growth Mentor",
    hourlyRate: 65,
    industry: "Marketing",
  },
];

const industries = ["Tech", "Finance", "Marketing", "Legal"];

const MentorMatchmaking = () => {
  const [filters, setFilters] = useState({
    industry: "",
    minRating: "",
    maxRate: "",
    keyword: "",
  });
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [discussion, setDiscussion] = useState("");

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredMentors = mentorsData.filter((m) => {
    const keywordMatch = filters.keyword
      ? !(
          m.name.toLowerCase().includes(filters.keyword.toLowerCase()) ||
          m.skills.some((s) =>
            s.toLowerCase().includes(filters.keyword.toLowerCase()),
          ) ||
          m.badge.toLowerCase().includes(filters.keyword.toLowerCase()) ||
          m.industry.toLowerCase().includes(filters.keyword.toLowerCase())
        )
      : false;

    const minRating =
      filters.minRating === "" ? 0 : Number.parseFloat(filters.minRating);
    const maxRate =
      filters.maxRate === "" ? Infinity : Number.parseFloat(filters.maxRate);

    return (
      (!filters.industry || m.industry === filters.industry) &&
      m.rating >= minRating &&
      m.hourlyRate <= maxRate &&
      !keywordMatch
    );
  });

  const handleBookSession = (mentor) => {
    setSelectedMentor(mentor);
    setDiscussion("");
  };

  const handleConfirm = () => {
    alert(
      `Session requested with ${selectedMentor.name}.\nDiscussion: ${discussion}`,
    );
    setSelectedMentor(null);
  };

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-2">
        Mentor Matchmaking
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Find the most relevant mentors for your goals.
      </p>

      {/* Filters */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          name="keyword"
          placeholder="Search by name, skill, badge, or industry"
          value={filters.keyword}
          onChange={handleFilterChange}
          className="flex-1 px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
        />
        <select
          name="industry"
          value={filters.industry}
          onChange={handleFilterChange}
          className="px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="minRating"
          placeholder="Min Rating"
          value={filters.minRating}
          onChange={handleFilterChange}
          className="px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
          min={0}
          max={5}
          step={0.1}
        />
        <input
          type="number"
          name="maxRate"
          placeholder="Max Rate ($/hr)"
          value={filters.maxRate}
          onChange={handleFilterChange}
          className="px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
          min={0}
        />
      </div>

      {/* Mentor Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.length ? (
          filteredMentors.map((mentor) => (
            <div
              key={mentor.name}
              className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 border-t-4 border-blue-400 hover:scale-105 transition-transform"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{mentor.name}</h2>
                <span className="text-sm text-gray-500">{mentor.badge}</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Skills:</strong> {mentor.skills.join(", ")}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Rating:</strong>{" "}
                <span className="font-semibold">{mentor.rating}</span> ⭐
              </p>
              <p className="text-sm text-gray-600">
                <strong>Hourly Rate:</strong>{" "}
                <span className="font-semibold">${mentor.hourlyRate}</span>
              </p>
              <p className="text-sm text-gray-600">
                <strong>Industry:</strong> {mentor.industry}
              </p>
              <button
                onClick={() => handleBookSession(mentor)}
                className="mt-3 bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition"
              >
                Book Session
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            No mentors match your filters.
          </p>
        )}
      </div>

      {/* Book Session Modal */}
      {selectedMentor && (
        <div
          className="fixed inset-0 flex justify-center items-center p-4 z-50 transition-opacity duration-300"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 transform transition-transform duration-300 scale-95 animate-scale-up">
            <h2 className="text-xl font-bold mb-2">{selectedMentor.name}</h2>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Skills:</strong> {selectedMentor.skills.join(", ")}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Hourly Rate:</strong> ${selectedMentor.hourlyRate}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Industry:</strong> {selectedMentor.industry}
            </p>
            <textarea
              value={discussion}
              onChange={(e) => setDiscussion(e.target.value)}
              placeholder="What do you want to ask or discuss?"
              className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-400"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedMentor(null)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorMatchmaking;
