'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import styles from '../styles/AuthForm.module.scss';
import AuthImage from './AuthImage'; 

export default function OtpForm() {
  const [confirmationCode, setOtp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      toast.warning('No email found. Please register again.');
      router.push('/register');
    }
  }, [router]);

  const handleOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/auth/confirm-otp', {
        email,
        confirmationCode,
      });

      toast.success(res.data?.message || 'OTP verified!');
      router.push('/login');
    } catch (err: any) {
      console.error('OTP Error:', err);
      const msg =
        err.response?.data?.message || err.response?.data?.error || 'OTP verification failed.';
      toast.error(msg);
    }
  };

  return (
    <div className={styles.outerContainer}>
      <div className={styles.formContainer}>
        <AuthImage />
        <div className={styles.formRight}>
          <form className={styles.otpForm} onSubmit={handleOTP}>
            <header><h1>Verify OTP</h1><p>Enter the OTP sent to your email</p></header>
            <section>
              <label><p>OTP</p><input type="text" value={confirmationCode} onChange={(e) => setOtp(e.target.value)} /></label>
              <button type="submit">Confirm Registration</button>
            </section>
            <footer><button type="button" onClick={() => router.push('/register')}>Back</button></footer>
          </form>
        </div>
      </div>
    </div>
  );
}
