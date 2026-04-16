import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

const Profile = () => {
  const { getToken } = useAuth();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await getToken();

      const res = await fetch("http://localhost:5000/api/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      setUser(data);
    };

    fetchUser();
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

export default Profile;
