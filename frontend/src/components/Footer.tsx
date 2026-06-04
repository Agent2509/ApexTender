"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "/#integrations" },
  ],
  company: [
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
    { label: "Blog", href: "/#blog" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/#privacy" },
    { label: "Terms of Service", href: "/#terms" },
    { label: "Security", href: "/#security" },
  ],
};

const socialLinks = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-[#09090b]">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12">
        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © 2026 Apex Tender Enterprise. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
