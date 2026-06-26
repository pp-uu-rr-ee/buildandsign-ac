"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

type Values = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
};

type Props = {
  defaultValues?: Values;
  errors?: Partial<Record<keyof Values, string[] | undefined>>;
  disabled?: boolean;
};

/**
 * The five location inputs shared by the account address book and the
 * checkout / booking selectors. Uncontrolled — they submit via their `name`
 * attributes inside whatever <form> wraps them.
 */
export function AddressFields({ defaultValues, errors, disabled }: Props) {
  const { lang } = useLanguage();
  const th = lang === "th";

  return (
    <div className="space-y-3">
      <Field
        label={th ? "ที่อยู่" : "Address"}
        name="addressLine1"
        required
        defaultValue={defaultValues?.addressLine1 ?? ""}
        error={errors?.addressLine1?.[0]}
        disabled={disabled}
      />
      <Field
        label={th ? "ที่อยู่ (เพิ่มเติม)" : "Address line 2"}
        name="addressLine2"
        defaultValue={defaultValues?.addressLine2 ?? ""}
        disabled={disabled}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field
          label={th ? "อำเภอ/เขต" : "City"}
          name="city"
          required
          defaultValue={defaultValues?.city ?? ""}
          error={errors?.city?.[0]}
          disabled={disabled}
        />
        <Field
          label={th ? "จังหวัด" : "Province"}
          name="province"
          required
          defaultValue={defaultValues?.province ?? ""}
          error={errors?.province?.[0]}
          disabled={disabled}
        />
        <Field
          label={th ? "รหัสไปรษณีย์" : "Postal code"}
          name="postalCode"
          required
          defaultValue={defaultValues?.postalCode ?? ""}
          error={errors?.postalCode?.[0]}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  defaultValue,
  error,
  disabled,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        defaultValue={defaultValue}
        disabled={disabled}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
