// LandingPage.js
import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '../firebase';

const provider = new GoogleAuthProvider();

const LandingPage = () => {
    const [showLogin, setShowLogin] = useState(false);

    useEffect(() => {
        console.log(auth);
    }, []);

    return (
        <div className='landing'>
            <div className='inner'>
                <div className='vector'>
                    <img width={"100%"} src="/landing.png" />
                </div>
                <div>
                    <h1>Create Personalised <strong>Healthy Meals</strong> from what's in your Fridge</h1>
                    {showLogin ? <button className='google-btn' onClick={() => {
                        signInWithPopup(auth, provider).then((result) => {
                            // This gives you a Google Access Token. You can use it to access the Google API.
                            const credential = GoogleAuthProvider.credentialFromResult(result);
                            const token = credential.accessToken;
                            // The signed-in user info.
                            const user = result.user;

                            localStorage.setItem("firebase_user_green_plates", JSON.stringify(user));
                            
                            window.location = "/dashboard";
                        }).catch((error) => {
                            console.log(error);
                        });
                    }}>Continue with <img style={{ marginLeft: 5 }} src="https://white.logodownload.org/wp-content/uploads/2020/11/google-white-logo.png" width={60} /></button> : <button onClick={() => setShowLogin(true)}>Get Started</button>}
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
