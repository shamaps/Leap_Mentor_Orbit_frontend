// src/features/admin/presenter/useAdminSettings.js
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getCommissionSettings, addAdmin, updateCommissionRate } from "../model/admin.api";
import { useToast } from "@/shared/context/ToastContext";
import { commissionSchema, addAdminSchema } from "@/shared/schemas/settingsSchemas";

export const useAdminSettings = () => {
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [tempPw, setTempPw] = useState("");
  const [savingCommission, setSavingCommission] = useState(false);
  const { showToast } = useToast();

  // Two independent actions, each its own form + schema — there's no
  // single <form onSubmit> here, both are triggered by a button
  // onClick, so handleSubmit is wired to onClick instead of a submit
  // event.
  const commissionForm = useForm({
    resolver: zodResolver(commissionSchema),
    defaultValues: { commission: "" },
  });

  const addAdminForm = useForm({
    resolver: zodResolver(addAdminSchema),
    defaultValues: { adminName: "", adminEmail: "" },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getCommissionSettings();
        commissionForm.setValue("commission", String(data.commissionRate));
      } catch {
        showToast({ message: "Failed to load settings.", type: "error" });
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // zodResolver has already validated name/email by the time this runs.
  const handleAddAdmin = async (data) => {
    try {
      setAddingAdmin(true);
      setTempPw("");
      const res = await addAdmin(data.adminName.trim(), data.adminEmail.trim());
      setTempPw(res.data.tempPassword);
      showToast({ message: `Admin account created for ${data.adminEmail}` });
      addAdminForm.reset({ adminName: "", adminEmail: "" });
    } catch (err) {
      showToast({
        message: err?.response?.data?.message || "Failed to create admin.",
        type: "error",
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  // zodResolver has already validated the 0-100 range by the time this runs.
  const handleSaveCommission = async (data) => {
    const rate = Number.parseFloat(data.commission);
    try {
      setSavingCommission(true);
      await updateCommissionRate(rate);
      showToast({ message: `Commission rate set to ${rate}%` });
    } catch (err) {
      showToast({
        message: err?.response?.data?.message || "Failed to update commission.",
        type: "error",
      });
    } finally {
      setSavingCommission(false);
    }
  };

  return {
    addingAdmin,
    tempPw,
    savingCommission,
    commissionForm,
    addAdminForm,
    handleAddAdmin,
    handleSaveCommission,
  };
};
