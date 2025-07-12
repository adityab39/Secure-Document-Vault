'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import styles from '../styles/AuthForm.module.scss';
import AuthImage from './AuthImage';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      alert("OTP sent to your email.");
      router.push('/otp');
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className={styles.outerContainer}>
      <div className={styles.formContainer}>
        <AuthImage />
        <div className={styles.formRight}>
          <form className={styles.forgotForm} onSubmit={handleForgot}>
            <header><h1>Forgot Password</h1><p>Seems like your password is missing</p></header>
            <section>
              <label><p>Email</p><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <button type="submit">Send email</button>
            </section>
            <footer><button type="button" onClick={() => router.push('/login')}>Back</button></footer>
          </form>
        </div>
      </div>
    </div>
  );
}
