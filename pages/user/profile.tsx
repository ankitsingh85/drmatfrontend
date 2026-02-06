import React from 'react';
import styles from '@/styles/user/profile.module.css';
import {
  List,
  ShoppingBag,
  Users,
  Headphones,
  Star,
  ChevronRight,
} from 'lucide-react';
import Footer from '@/components/Layout/Footer';
import Topbar from '@/components/Layout/Topbar';


const Profile = () => {
  return (
    <>
      <Topbar />

      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="User"
            className={styles.avatar}
          />
          <div className={styles.userInfo}>
            <div className={styles.name}>NAME</div>
            <div className={styles.email}>janedoe123@email.com</div>
          </div>
          <button className={styles.editBtn}>EDIT PROFILE</button>
        </div>

        <div className={styles.card}>
          <ProfileItem icon={<List size={20} />} label="All Appointments" />
          <ProfileItem icon={<ShoppingBag size={20} />} label="My Orders" />
          <ProfileItem icon={<Users size={20} />} label="Invite Friends" />
          <ProfileItem icon={<Headphones size={20} />} label="Customer Support" />
          <ProfileItem icon={<Star size={20} />} label="Rate Our App" />
        </div>
      </div>

      <Footer />
    </>
  );
};

const ProfileItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => {
  return (
    <div className={styles.profileItem}>
      <div className={styles.itemLeft}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={styles.itemRight}>
        <ChevronRight size={18} />
      </div>
    </div>
  );
};

export default Profile;