// Typed wrappers around react-redux's useDispatch/useSelector, so
// components get RootState/AppDispatch inference for free instead of
// needing to type useSelector<RootState>(...) at every call site.
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./index";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;