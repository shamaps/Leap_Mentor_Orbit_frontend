// src/test/components/mentee/dashboard/findMentors/SearchBar.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import SearchBar from "../../../../../components/mentee/dashboard/findMentors/SearchBar";

describe("SearchBar Component Suite", () => {
    const mockSetSkill = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the input with the current skill value", () => {
        render(<SearchBar skill="React" setSkill={mockSetSkill} totalCount={5} hasSearched={true} />);
        expect(screen.getByPlaceholderText(/Search by skill or name/i)).toHaveValue("React");
    });

    it("should call setSkill on every keystroke change", () => {
        render(<SearchBar skill="" setSkill={mockSetSkill} totalCount={0} hasSearched={false} />);
        fireEvent.change(screen.getByPlaceholderText(/Search by skill or name/i), {
            target: { value: "Python" },
        });
        expect(mockSetSkill).toHaveBeenCalledWith("Python");
    });

    it("should not render the clear button when skill is empty", () => {
        render(<SearchBar skill="" setSkill={mockSetSkill} totalCount={0} hasSearched={false} />);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render and operate the clear button when skill has a value", () => {
        render(<SearchBar skill="Design" setSkill={mockSetSkill} totalCount={3} hasSearched={true} />);
        const clearBtn = screen.getByRole("button");
        expect(clearBtn).toBeInTheDocument();

        fireEvent.click(clearBtn);
        expect(mockSetSkill).toHaveBeenCalledWith("");
    });
});