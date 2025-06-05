import React from "react";
import { useLocation } from "react-router-dom";

function Sidebar({ account, role, sidebarOpen, setSidebarOpen, getNavigationLinks, getLinkIcon }) {
  const location = useLocation();
  if (!account) return null;
  return (
    // <nav
    //   className={`col-md-3 col-lg-2 madtx-sidebar sidebar py-4 shadow-sm ${sidebarOpen ? "d-block" : "d-none d-md-block"}`}
    //   style={{ minHeight: "100vh", zIndex: 1000, position: "relative" }}
    // >
      <div className="position-sticky">
        <ul className="nav flex-column px-3">
          {getNavigationLinks().map((link, index) => {
            const isActive = location.pathname === link.to;
            return (
              <li className="nav-item" key={index}>
                <a
                  href={link.to}
                  className={`nav-link d-flex align-items-center gap-2 py-2 rounded ${isActive ? "madtx-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  tabIndex={0}
                  style={{
                    background: isActive ? "var(--madtx-green-opacity)" : "transparent",
                    color: isActive ? "var(--madtx-green)" : "inherit",
                    fontWeight: isActive ? 600 : 400,
                    outline: isActive ? "2px solid var(--madtx-green)" : "none"
                  }}
                >
                  {getLinkIcon(link.text)}
                  {link.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    // </nav>
  );
}

export default Sidebar; 