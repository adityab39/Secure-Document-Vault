'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '../utils/axiosInstance';
import styles from '../styles/AuthForm.module.scss';
import AuthImage from './AuthImage';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.authResponse?.IdToken);
      localStorage.setItem('userId', response.data.userId);
      router.push('/home');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.outerContainer}>
      <div className={styles.formContainer}>
        <AuthImage />
        <div className={styles.formRight}>
          <form onSubmit={handleLogin}>
            <header>
              <h1>Welcome back</h1>
              <p>Login to continue</p>
            </header>
            <section>
              <label>
                <p>Email</p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your e-mail" />
                <div className={styles.border}></div>
              </label>
              <label>
                <p>Password</p>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                <div className={styles.border}></div>
              </label>
              <button type="submit">Login</button>
            </section>
            <footer>
              <button type="button" onClick={() => router.push('/forgot-password')}>Forgot password?</button>
              <button type="button" onClick={() => router.push('/register')}>Need an account?</button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
