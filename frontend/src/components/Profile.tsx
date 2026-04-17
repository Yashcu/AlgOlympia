import { useUserData } from "../hooks/useUserData";

const Profile = () => {
  const { data: user, isLoading, error } = useUserData();

  if (isLoading) return <div>Loading...</div>;
  if (error || !user) return <div>Error loading profile</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

export default Profile;