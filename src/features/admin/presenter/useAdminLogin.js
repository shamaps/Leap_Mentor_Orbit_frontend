// src/features/admin/presenter/useAdminLogin.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAdmin } from "../model/admin.api";
import { loginSchema } from "@/shared/schemas/authSchemas";
import { mapServerErrorsToForm } from "@/shared/utils/mapServerErrorsToForm";

export const useAdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // register() gives us its own onBlur (used for RHF's validation
  // lifecycle); this form also imperatively resets the border color on
  // blur, so both are called rather than one replacing the other.
  const emailField = register("email");
  const passwordField = register("password");

  const onSubmit = async (data) => {
    clearErrors("root");
    setLoading(true);
    try {
     
      await loginAdmin(data.email, data.password);
      navigate("/admin/users");
    } catch (err) {
      mapServerErrorsToForm(err, setError);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    showPass,
    setShowPass,
    handleSubmit,
    onSubmit,
    emailField,
    passwordField,
    errors,
  };
};
