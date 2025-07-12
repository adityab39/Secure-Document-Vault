'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import styles from '../styles/AuthForm.module.scss';
import AuthImage from './AuthImage';
import { toast } from 'react-toastify';

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', repeatPassword: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.repeatPassword) return alert("Passwords don't match");

    try {
      const { username, email, password } = formData;
      const res = await axiosInstance.post('/auth/register', { name: username, email, password });

      toast.success(res.data.message || 'Registered successfully!');
      localStorage.setItem('email', email);

      router.push('/otp');
    } catch (err: any) {
        const msg = err.response?.data?.message || 'Registration failed.';
        toast.error(msg)
    }
  };

  return (
    <div className={styles.outerContainer}>
      <div className={styles.formContainer}>
        <AuthImage />
        <div className={styles.formRight}>
          <form className={styles.registerForm} onSubmit={handleRegister}>
            <header><h1>Secure your Documents</h1><p>Register to gain full access</p></header>
            <section>
              <label><p>Username</p><input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} /></label>
              <label><p>Email</p><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></label>
              <label><p>Password</p><input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} /></label>
              <label><p>Repeat Password</p><input type="password" value={formData.repeatPassword} onChange={(e) => setFormData({...formData, repeatPassword: e.target.value})} /></label>
              <button type="submit">Register</button>
            </section>
            <footer><button type="button" onClick={() => router.push('/login')}>Back</button></footer>
          </form>
        </div>
      </div>
    </div>
  );
}
