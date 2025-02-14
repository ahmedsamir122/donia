import classes from "./SigninCard.module.css";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { authActions } from "../../store/login-slice";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "react-query";
import { URL, updateFileData } from "../utils/queryFunctions";
import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const postData = (data) => {
  return axios.post(`${URL}/api/v1/users/signin`, data, {
    withCredentials: true,
  });
};

const SigninCard = () => {
  const [otp, setOtp] = useState("");
  const [errorOtp, setErrorOtp] = useState(false);
  const recaptchaVerifierRef = useRef(null); // Use useRef to keep reference
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [value, setValue] = useState();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const verifyPhone = (data) => {
    console.log("verify");
    return updateFileData(`${URL}/api/v1/users/verifyPhone`, data);
  };

  const { mutate, isError, error } = useMutation(postData, {
    onSuccess: async (data) => {
      console.log(data.data.data);

      if (
        data.data.data.user.status === "3d" ||
        data.data.data.user.status === "1w" ||
        data.data.data.user.status === "2w" ||
        data.data.data.user.status === "1m" ||
        data.data.data.user.status === "blocked"
      ) {
        dispatch(authActions.login(data.data.data.user));
        localStorage.setItem("token", "blocked");
        navigate("/blocked");
      }
      if (data.data.data.user.status === "pending") {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: (response) => {
              console.log("reCAPTCHA verified:", response);
            },
            appVerificationDisabledForTesting: true, // Disable for testing
          } // Firebase auth instance
        );

        // Send OTP

        try {
          const confirmationResult = await signInWithPhoneNumber(
            auth,
            `+${data.data.data.user.phone}`,
            recaptchaVerifierRef.current
          );
          console.log(confirmationResult);
          setConfirmationResult(confirmationResult);
        } catch (error) {
          console.log(error);
        }
      }
      if (data.data.data.user.status === "active") {
        localStorage.setItem("token", data.data.token);
        dispatch(authActions.login(data.data.data.user));
        dispatch(authActions.getToken(data.data.token));

        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 48);
        localStorage.setItem("expiration", expiration.toISOString());
        navigate("/");
      }
      console.log(data.data.data.user);
    },
  });

  const {
    mutate: mutateVerify,
    isError: isErrorVerify,
    error: errorVerify,
  } = useMutation(verifyPhone, {
    onSuccess: (data) => {
      console.log(data.data.data.user, data.data.token);
      localStorage.setItem("token", data.data.token);
      dispatch(authActions.login(data.data.data.user));
      dispatch(authActions.getToken(data.data.token));
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 48);
      localStorage.setItem("expiration", expiration.toISOString());
      navigate("/");
    },
  });

  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm({ mode: "onSubmit" });

  const onsubmit = async (data) => {
    console.log(error);
    const [phone, password] = getValues(["phone", "password"]);

    mutate({ phone, password });
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      const result = await confirmationResult.confirm(otp);

      // The user signed in successfully
      // alert("User signed in successfully");

      // Get the Firebase ID token
      const idToken = await result.user.getIdToken();

      // Now you have the ID token
      console.log("Firebase Token:", idToken);

      // You can use this token for any server-side verification or authentication
      mutateVerify({ token: idToken });

      // Proceed with the rest of your logic
      console.log(result.user); // Signed-in user info
    } catch (error) {
      setErrorOtp(true);
      console.error("Invalid OTP: ", error);
    }
  };

  const resendOTP = async () => {
    if (!confirmationResult) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => {
            console.log("reCAPTCHA verified for resend:", response);
          },
          appVerificationDisabledForTesting: true,
        }
      );

      try {
        const confirmation = await signInWithPhoneNumber(
          auth,
          `+${value}`, // Use the current phone number value
          recaptchaVerifierRef.current
        );
        console.log("OTP Resent: ", confirmation);
        setConfirmationResult(confirmation); // Store the new confirmation result
      } catch (error) {
        console.log("Error resending OTP:", error);
      }
    }
  };

  return (
    <div className={classes.main}>
      {!confirmationResult && (
        <div className={classes.card}>
          <div className={classes.title}>
            <Link to="/">Donia</Link>
          </div>

          <form className={classes.form} onSubmit={handleSubmit(onsubmit)}>
            <input
              type="number"
              placeholder="Phone Number"
              {...register("phone", { required: true })}
              onChange={(e) => setValue(e.target.value)}
            />
            {errors.email?.type === "required" && (
              <p className={classes.error}>please enter your email address</p>
            )}
            <input
              type="password"
              placeholder="Password"
              {...register("password", { required: true })}
            />
            {errors.password?.type === "required" && (
              <p className={classes.error}>please enter your password</p>
            )}
            <div
              className={classes.forget}
              onClick={() => navigate("/forgotPassword")}
            >
              Forgetten passowrd?
            </div>
            {isError && (
              <p className={classes.error}>{error.response.data.message}</p>
            )}
            <button className={classes.button}>Log in</button>
          </form>

          <div>
            <span className={classes.ask}>Don't have an account ?&nbsp;</span>
            <Link className={classes.askLink} to="/signup">
              Sign Up
            </Link>
          </div>
        </div>
      )}
      {confirmationResult && (
        <form className={classes.verifyForm} onSubmit={handleVerifyOTP}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />
          <button type="button" onClick={resendOTP}>
            resend OTP
          </button>
          <button type="submit">Verify OTP</button>
          {errorOtp && <p className={classes.error}>this otp isn't valid</p>}
        </form>
      )}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default SigninCard;
