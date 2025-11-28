function Home() {
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/airtable`;
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Welcome</h1>
      <button
        onClick={handleLogin}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#1e293b",
          color: "white",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: "500",
        }}
      >
        Login with Airtable
      </button>
    </div>
  );
}

export default Home;
