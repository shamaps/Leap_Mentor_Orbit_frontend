import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminPageLoader from "../../../shared/components/AdminPageLoader";

describe("AdminPageLoader", () => {
  it("renders the admin loading indicator and message", () => {
    const { container } = render(<AdminPageLoader />);
    expect(screen.getByText("Loading admin dashboard...")).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
