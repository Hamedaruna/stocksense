"use client";

import { useEffect, useState } from "react";

type Settings = {
  businessName: string;
  ownerName: string;
  phone: string;
  businessType: string;
};

const defaultSettings: Settings = {
  businessName: "My Business",
  ownerName: "",
  phone: "",
  businessType: "Retail",
};

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<Settings>(defaultSettings);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("stocksense-settings");

    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {
        setSettings(defaultSettings);
      }
    }
  }, []);

  function updateSetting(
    field: keyof Settings,
    value: string
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  function saveSettings() {
    localStorage.setItem(
      "stocksense-settings",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  }

  function resetSettings() {
    localStorage.removeItem("stocksense-settings");
    setSettings(defaultSettings);
    setSaved(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* HEADER */}
      <div className="mb-8">
        <p className="text-sm font-medium tracking-widest text-gray-500">
          STOCKSENSE
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-gray-900">
          Settings
        </h1>

        <p className="mt-2 text-gray-500">
          Manage your business information and preferences.
        </p>
      </div>

      {/* BUSINESS PROFILE */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Business Profile
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Keep your business information up to date.
          </p>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* BUSINESS NAME */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Business name
            </label>

            <input
              type="text"
              value={settings.businessName}
              onChange={(e) =>
                updateSetting(
                  "businessName",
                  e.target.value
                )
              }
              placeholder="e.g. Aruna Stores"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black"
            />
          </div>

          {/* OWNER NAME */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Owner name
            </label>

            <input
              type="text"
              value={settings.ownerName}
              onChange={(e) =>
                updateSetting(
                  "ownerName",
                  e.target.value
                )
              }
              placeholder="e.g. Aruna Hamed"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black"
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone number
            </label>

            <input
              type="tel"
              value={settings.phone}
              onChange={(e) =>
                updateSetting(
                  "phone",
                  e.target.value
                )
              }
              placeholder="e.g. 08012345678"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black"
            />
          </div>

          {/* BUSINESS TYPE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Business type
            </label>

            <select
              value={settings.businessType}
              onChange={(e) =>
                updateSetting(
                  "businessType",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black"
            >
              <option value="Retail">
                Retail
              </option>

              <option value="Grocery">
                Grocery
              </option>

              <option value="Mini Mart">
                Mini Mart
              </option>

              <option value="Pharmacy">
                Pharmacy
              </option>

              <option value="Fashion">
                Fashion
              </option>

              <option value="Electronics">
                Electronics
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* BUSINESS PREFERENCES */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Business Preferences
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Basic information about how your StockSense account is configured.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {/* CURRENCY */}
          <div className="flex items-center justify-between gap-6 p-6">
            <div>
              <p className="font-medium text-gray-900">
                Currency
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Currency used throughout StockSense.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
              ₦ Nigerian Naira
            </div>
          </div>

          {/* DATA STORAGE */}
          <div className="flex items-center justify-between gap-6 p-6">
            <div>
              <p className="font-medium text-gray-900">
                Data storage
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Your business data is stored locally for this setup.
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Active
            </span>
          </div>
        </div>
      </section>

      {/* SAVE */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Save changes
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Save your business information on this device.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetSettings}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={saveSettings}
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Save Changes
            </button>
          </div>
        </div>

        {saved && (
          <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            ✓ Settings saved successfully.
          </div>
        )}
      </section>
    </main>
  );
}