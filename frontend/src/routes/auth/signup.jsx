import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setLogin } from "@/redux/authSlice";
import { Link } from "@tanstack/react-router";
import { register } from "@/services/auth";

export const Route = createFileRoute("/auth/signup")({
  component: SignupComponent,
});

function SignupComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);



  const navigate = useNavigate();
  const dispatch = useDispatch();


  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const data = await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      dispatch(setLogin({ token: data.token, user: data.user }));

      if (data.user?.user_type === "employee") {
        navigate({ to: "/employee" });
      } else {
        navigate({ to: "/order" });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <form
        onSubmit={handleSignup}
        className="p-8 bg-background shadow-md rounded-xl w-96 space-y-4 border border-border"
      >
        <h2 className="text-2xl font-bold mb-2 text-foreground">Create Account</h2>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div>
          <label
            htmlFor="firstName"
            className="block mb-1 text-sm font-medium text-foreground"
          >
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="John"
            value={firstName}
            // onChange={(e) => setFirstName(e.target.value)}
            onChange={(e) => {
              const value = e.target.value;
              const onlyLetters = value.replace(/[^a-zA-Z]/g, "");

              setFirstName(onlyLetters);
            }}
            className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
            autoComplete="given-name"
            required
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block mb-1 text-sm font-medium text-foreground"
          >
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Doe"
            value={lastName}
            // onChange={(e) => setLastName(e.target.value)}
            onChange={(e) => {
            const value= e.target.value;
            const onlyLetters = value.replace(/[^a-zA-Z]/g, "");

            setLastName(onlyLetters);
          }}
            className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
            autoComplete="family-name"
            required
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block mb-1 text-sm font-medium text-foreground"
          >
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="1234567890"
            value={phoneNumber}
            onChange={(e) => {
              const value = e.target.value;
              const onlyNumbers = value.replace(/[^0-9]/g, "");
              setPhoneNumber(onlyNumbers);
            }}
            className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
            required
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block mb-1 text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block mb-1 text-sm font-medium text-foreground"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
            autoComplete="new-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-amber-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
