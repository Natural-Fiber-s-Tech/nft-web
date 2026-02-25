import React, { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  User,
  MessageCircle,
  Building,
} from "lucide-react";
import { useLanguage } from "../../context/hooks/useLanguage";

// Contact form component
// - Simple controlled form
// - Submits using a mailto link (opens user's email client)
// - Icons from lucide-react for better UX
const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const { t } = useLanguage();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `Consulta desde sitio web - ${formData.company || formData.name}`
    );
    const body = encodeURIComponent(
      `Nombre: ${formData.name}\nEmail: ${formData.email}\nEmpresa: ${formData.company}\nMensaje:\n${formData.message}`
    );
    const mailtoUrl = `mailto:naturalfiberstech@gmail.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-7 md:p-8 rounded-2xl shadow-lg border border-gray-200"
    >
      <div className="text-center mb-2">
        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {t("contact.contactUs")}
        </h3>
        <p className="text-gray-600 text-sm">{t("contact.weAreHere")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            name="name"
            placeholder={t("contact.placeholders.name")}
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="email"
            name="email"
            placeholder={t("contact.placeholders.email")}
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      <div className="relative">
        <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          name="company"
          placeholder={t("contact.placeholders.company")}
          value={formData.company}
          onChange={handleInputChange}
          className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div className="relative">
        <MessageCircle className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <textarea
          name="message"
          placeholder={t("contact.placeholders.message")}
          value={formData.message}
          onChange={handleInputChange}
          required
          rows={5}
          className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-5 rounded-lg transition-colors"
      >
        <Send className="h-5 w-5" /> {t("contact.sendInquiry")}
      </button>

      <p className="text-xs text-gray-500 text-center">
        {t("contact.mailtoNote")}
      </p>
    </form>
  );
};

// Main Contact section
// - Follows existing page layout: header is global, WhatsApp floating, Footer at bottom
// - Uses our 12-col utility grid (grid-ctx + span-*) and Tailwind for styling
// - Social links use Footer-style SVGs with theme-friendly color and brand hovers
// - Map is omitted for security; we render a safe placeholder instead
const Contact = () => {
  const { t } = useLanguage();
  const contactInfo = [
    {
      icon: Mail,
      title: t("contact.titles.email"),
      details: ["naturalfiberstech@gmail.com"],
      action: "mailto:naturalfiberstech@gmail.com",
    },
    {
      icon: Phone,
      title: t("contact.titles.phone"),
      details: ["+51 988 496 839"],
      action: "tel:+51988496839",
    },
    {
      icon: Clock,
      title: t("contact.titles.hours"),
      details: ["Lun - Vie: 9:00 - 18:00", "Sáb: 9:00 - 13:00"],
      action: null,
    },
    {
      icon: MapPin,
      title: t("contact.titles.location"),
      details: ["La Molina", "Lima, Perú"],
      action: null,
    },
  ];

  // Social icons (SVG) consistent with Footer, updated links and brand hovers
  const socialLinks = [
    {
      label: "Facebook",
      href: "https://www.facebook.com/profile.php?id=100064291801913#",
      color: "hover:text-blue-600",
      svg: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M22 12a10 10 0 10-11.5 9.95v-7.04H7.9V12h2.6V9.8c0-2.57 1.53-3.99 3.87-3.99 1.12 0 2.29.2 2.29.2v2.51h-1.29c-1.27 0-1.66.79-1.66 1.6V12h2.83l-.45 2.91h-2.38v7.04A10 10 0 0022 12z" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/fibers-tech/",
      color: "hover:text-blue-700",
      svg: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V23h-4V8zM8.5 8h3.8v2.05h.05c.53-1 1.84-2.05 3.8-2.05 4.06 0 4.8 2.67 4.8 6.15V23h-4v-7.1c0-1.7-.03-3.9-2.38-3.9-2.38 0-2.75 1.86-2.75 3.78V23h-4V8z" />
        </svg>
      ),
    },
    {
      label: "YouTube",
      // href: "https://www.youtube.com/channel/UCm3n-3n546Q0fcVMylG7Kig",
      href: "https://www.youtube.com/@naturalfiberstech953",
      color: "hover:text-red-600",
      svg: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.005 3.005 0 00-2.116-2.127C19.44 3.5 12 3.5 12 3.5s-7.44 0-9.382.559A3.005 3.005 0 00.502 6.186C0 8.14 0 12 0 12s0 3.86.502 5.814a3.005 3.005 0 002.116 2.127C4.56 20.5 12 20.5 12 20.5s7.44 0 9.382-.559a3.005 3.005 0 002.116-2.127C24 15.86 24 12 24 12s0-3.86-.502-5.814zM9.75 15.569V8.431L15.818 12 9.75 15.569z" />
        </svg>
      ),
    },
    {
      label: "X",
      // href: "https://x.com/fiberstech",
      href: "https://x.com/fibers_tech",
      color: "hover:text-black",
      svg: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2H21.5l-7.5 8.568L23.5 22h-7.356l-5.754-7.206L3.5 22H.244l8.214-9.393L.5 2h7.38l5.19 6.69L18.244 2zm-1.29 18h2.02L7.12 4H5.02l11.934 16z" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      href: "https://instagram.com/nft_sac/",
      color: "hover:text-pink-600",
      svg: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM18 6.5a1 1 0 110 2 1 1 0 010-2z" />
        </svg>
      ),
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@nft_sac?lang=es-419",
      color: "hover:text-black",
      svg: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="contacto"
      className="bg-gray-50 rounded-2xl shadow-lg pt-[50px] pb-[1px]"
    >
      <div className="w-full px-4">
        {/* Header */}
        <div className="grid-ctx mb-[40px]">
          <div className="span-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {t("contact.talk").split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-red-600">
                {t("contact.talk").split(" ").slice(-1)[0]}
              </span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              {t("contact.lead")}
            </p>
          </div>
        </div>

        <div className="grid-ctx mb-[40px]">
          {/* Contact Information */}
          <div className="span-12 lg:span-6 space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {t("contact.contactInfo")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <div
                      key={index}
                      // Responsive card padding and width to avoid overflow; allow word breaks for long content
                      className="bg-white w-[100%] mx-auto p-6 md:p-3 lg:p-5 rounded-2xl shadow-lg border border-gray-200"
                    >
                      <div className="flex items-center mb-2">
                        <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                          <IconComponent className="h-5 w-5 text-red-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">
                          {info.title}
                        </h4>
                      </div>
                      <div className="space-y-0.5 break-words break-all">
                        {info.details.map((detail, idx) => (
                          <p
                            key={idx}
                            className="text-gray-600 text-[13px] md:text-[12px] leading-relaxed"
                          >
                            {info.action ? (
                              <a
                                href={info.action}
                                className="hover:text-red-600 transition-colors break-words"
                              >
                                {detail}
                              </a>
                            ) : (
                              detail
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-6">
                {t("contact.followUs")}
              </h4>
              <div className="flex space-x-4 m-6">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center text-gray-500 transition-all duration-200 hover:shadow-lg ${social.color} border border-gray-200`}
                    aria-label={social.label}
                  >
                    {social.svg}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="span-12 lg:span-6">
            <ContactForm />
          </div>
        </div>

        {/* Map Placeholder (no real map embedded) */}
        <div className="grid-ctx mb-[30px]">
          <div className="span-12 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              {t("contact.location")}
            </h3>
            <div className="h-64 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-red-300 mx-auto mb-2" />
                <p className="text-gray-600">La Molina, Lima - Perú</p>
                <p className="text-sm text-gray-500 mt-1">
                  {t("contact.mapSoon")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
