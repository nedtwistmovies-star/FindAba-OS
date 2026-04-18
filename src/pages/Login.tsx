
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../features/auth/Login';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Login 
            setView={(v) => {
                if (v === 'home') navigate('/');
                else navigate(`/${v}`);
            }} 
            onAuthSuccess={() => navigate('/dashboard')} 
        />
    );
};

export default LoginPage;
