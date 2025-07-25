// src/components/DashboardDummy.jsx

import React from "react";

const dummyUsers = [
  { name: "JD", color: "#3b82f6" },
  { name: "UL", color: "#22c55e" },
  { name: "PN", color: "#f97316" },
];

export default function DashboardDummy() {
  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        fontFamily: "Inter, sans-serif",
        padding: 20,
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
        color: "#374151",
      }}
    >
      {/* Sidebar */}
      <nav
        style={{
          width: 72,
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgb(0 0 0 / 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 16,
          gap: 20,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            backgroundColor: "#4f46e5",
            borderRadius: "50%",
          }}
        />
        <SidebarIcon bg="#c7d2fe" />
        <SidebarIcon bg="#fbcfe8" />
        <SidebarIcon bg="#e0e7ff" />
        <SidebarIcon bg="#f9a8d4" />
        <SidebarIcon bg="#fbbf24" />
        <SidebarIcon bg="#a5b4fc" />
        <div style={{ flexGrow: 1 }} />
        <SidebarIcon bg="#6ee7b7" />
      </nav>

      {/* Main content */}
      <main
        style={{
          flexGrow: 1,
          maxWidth: 1200,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Topbar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 12px",
          }}
        >
          <h1 style={{ fontWeight: 700, fontSize: 24 }}>Sales Overview</h1>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <SearchBox />
            <IconCircle emoji="☀️" />
            <IconCircle emoji="🎨" />
            <BellIcon hasNotification />
            <GridIcon />
          </div>
        </header>

        {/* Charts and stats */}
        <section
          style={{
            display: "flex",
            gap: 24,
          }}
        >
          {/* Left charts */}
          <div
            style={{
              flexBasis: "65%",
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 2px 10px rgb(0 0 0 / 0.05)",
            }}
          >
            <IncomeChart />
          </div>

          {/* Right stats grid */}
          <div
            style={{
              flexBasis: "35%",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
            }}
          >
            <StatBox label="Income" value="$67.6k" icon="💰" bg="#ede9fe" />
            <StatBox label="Completed" value="12.6K" icon="✅" bg="#dcfce7" />
            <StatBox label="Pending" value="143" icon="⏰" bg="#ffedd5" />
            <StatBox label="Dispatch" value="651" icon="🚚" bg="#d0f2fe" />
            <StatBox label="Products" value="46k" icon="📦" bg="#fce7f3" />
            <StatBox label="Customers" value="8.8k" icon="👥" bg="#fee2e2" />
          </div>
        </section>

        {/* Projects & customer satisfaction */}
        <section
          style={{
            display: "flex",
            gap: 24,
          }}
        >
          {/* Projects status */}
          <div
            style={{
              flexBasis: "65%",
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 2px 10px rgb(0 0 0 / 0.05)",
            }}
          >
            <h2 style={{ fontWeight: 600, marginBottom: 20 }}>
              Projects Status
            </h2>
            <div style={{ display: "flex", gap: 20 }}>
              <ProjectCard
                title="Web Design"
                subtitle="Design Learn Management System"
                tags={["UI/UX Design"]}
                progress={55.23}
                date="June 08, 2021"
                users={[dummyUsers[0], dummyUsers[1]]}
                color="#3b82f6"
              />
              <ProjectCard
                title="Mobile App"
                subtitle="Ecommerce Application"
                tags={["Ecommerce"]}
                progress={14.84}
                date="May 01, 2021"
                users={[dummyUsers[1], dummyUsers[2]]}
                color="#ec4899"
              />
              <ProjectCard
                title="Design System"
                subtitle="Create LMS design system on figma"
                tags={["LMS", "Figma"]}
                progress={87.4}
                date="September 16, 2021"
                users={[dummyUsers[2], dummyUsers[0]]}
                color="#f97316"
              />
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div
            style={{
              flexBasis: "35%",
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 2px 10px rgb(0 0 0 / 0.05)",
            }}
          >
            <h2 style={{ fontWeight: 600, marginBottom: 10 }}>
              Customer Satisfaction
            </h2>
            <div style={{ fontSize: 48, fontWeight: 700, color: "#4338ca" }}>
              9.7{" "}
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  color: "#16a34a",
                  marginLeft: 8,
                }}
              >
                +2.1%
              </span>
            </div>
            <p style={{ marginBottom: 24, color: "#6b7280" }}>
              Performance score
            </p>
            <SatisfactionBar />
          </div>
        </section>
      </main>
    </div>
  );
}

function SidebarIcon({ bg }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: bg,
      }}
    />
  );
}

function SearchBox() {
  return (
    <input
      type="search"
      placeholder="Search here..."
      style={{
        padding: "6px 12px",
        borderRadius: 20,
        border: "1px solid #d1d5db",
        width: 200,
      }}
    />
  );
}

function IconCircle({ emoji }) {
  return (
    <div
      style={{
        fontSize: 20,
        cursor: "pointer",
      }}
      title={emoji}
    >
      {emoji}
    </div>
  );
}

function BellIcon({ hasNotification }) {
  return (
    <div style={{ position: "relative", cursor: "pointer" }}>
      <svg
        fill="none"
        stroke="#374151"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="24"
        height="24"
      >
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {hasNotification && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 8,
            height: 8,
            backgroundColor: "#ef4444",
            borderRadius: "50%",
          }}
        />
      )}
    </div>
  );
}

function GridIcon() {
  return (
    <svg
      fill="none"
      stroke="#374151"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      style={{ cursor: "pointer" }}
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IncomeChart() {
  // Dummy bar chart with month labels and two colors of bars
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const barData1 = [6, 9, 7, 11, 8, 10, 14, 7, 9, 6, 11, 10];
  const barData2 = [3, 6, 5, 6, 4, 6, 8, 5, 6, 4, 6, 6];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <span role="img" aria-label="pie chart" style={{ fontSize: 24, color: "#3b82f6" }}>📊</span>
          <div style={{ fontSize: 28, fontWeight: "700" }}>$6,556.55</div>
          <div style={{ color: "#9ca3af" }}>this month</div>
        </div>
        <div style={{ color: "#22c55e", fontWeight: "700" }}>▲ 3.2%</div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {months.map((m, i) => (
          <div key={m} style={{ textAlign: "center" }}>
            <div
              style={{
                height: barData1[i] * 10,
                width: 10,
                backgroundColor: "#6366f1",
                borderRadius: 4,
                marginBottom: 2,
              }}
            />
            <div
              style={{
                height: barData2[i] * 10,
                width: 10,
                backgroundColor: "#60a5fa",
                borderRadius: 4,
              }}
            />
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{m}</div>
          </div>
        ))}
      </div>

      <button
        style={{
          padding: "8px 16px",
          borderRadius: 20,
          border: "1px solid #d1d5db",
          backgroundColor: "#fff",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Download Report
      </button>
    </div>
  );
}

function StatBox({ label, value, icon, bg }) {
  return (
    <div
      style={{
        backgroundColor: bg,
        borderRadius: 12,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 1px 3px rgb(0 0 0 / 0.1)",
      }}
    >
      <div
        style={{
          fontSize: 24,
        }}
        aria-label={label}
        title={label}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      </div>
    </div>
  );
}

function ProjectCard({ title, subtitle, tags, progress, date, users, color }) {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 12,
        backgroundColor: "#fef3c7",
        padding: 20,
        boxShadow: "0 1px 6px rgb(0 0 0 / 0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        borderLeft: `6px solid ${color}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{title}</h3>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{subtitle}</div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  backgroundColor: "#fde68a",
                  padding: "2px 6px",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          title="Settings"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: "#6b7280",
          }}
        >
          ⋮
        </button>
      </div>

      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 24,
            marginBottom: 2,
            color: "#4b5563",
          }}
        >
          %{progress.toFixed(2)}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>{date}</div>
      </div>

      <div style={{ display: "flex", gap: -8 }}>
        {users.map((u) => (
          <div
            key={u.name}
            title={u.name}
            style={{
              backgroundColor: u.color,
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "2px solid white",
              color: "white",
              fontWeight: 700,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 14,
              cursor: "default",
            }}
          >
            {u.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function SatisfactionBar() {
  const data = [
    { label: "Exellent", value: 1029, color: "#6366f1", percent: 42 },
    { label: "Very Good", value: 426, color: "#16a34a", percent: 18 },
    { label: "Good", value: 326, color: "#3b82f6", percent: 14 },
    { label: "Poor", value: 395, color: "#f97316", percent: 17 },
    { label: "Very Poor", value: 129, color: "#ef4444", percent: 9 },
  ];

  return (
    <div>
      <div style={{ height: 12, display: "flex", borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
        {data.map(({ color, percent, label }) => (
          <div
            key={label}
            title={`${label}: ${percent}%`}
            style={{
              backgroundColor: color,
              width: `${percent}%`,
            }}
          />
        ))}
      </div>
      {data.map(({ label, value, percent, color }) => (
        <div
          key={label}
          style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                backgroundColor: color,
                borderRadius: "50%",
                marginRight: 6,
              }}
            />
            {label}
          </div>
          <div>{value}</div>
          <div>{percent}%</div>
        </div>
      ))}
    </div>
  );
}
