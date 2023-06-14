// import StatefulComponent from "../StatefulComponent";
import { useDispatch, useSelector } from "react-redux";
import PurchaseLimits from "./PurchaseLimits";
import { toast } from "react-toastify";
import Popup from './Popup/Popup';
import { useEffect, useState } from "react";

const PurchaseForm = () => {
    const [invest, setInvestAmount] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [currentReward, setCurrentReward] = useState(0);

    const dispatch = useDispatch();
    const account = useSelector(state => state.account);
    const stakingTokenAmount = useSelector(state => state.stakingTokenAmount);
    const totalStakedAmount = useSelector(state => state.totalStakedAmount);
    const totalClaimedAmount = useSelector(state => state.totalClaimedAmount);
    const stakedTokenAmount = useSelector(state => state.stakedTokenAmount);
    const rewardTokenAmount = useSelector(state => state.rewardTokenAmount);
    const aprRate = useSelector(state => state.aprRate);
    const lastClaim = useSelector(state => state.lastClaim);

    const stake = () => {
        if (Number(invest) > 0) dispatch({ type: "STAKE_TOKEN", payload: { stakingTokenAmount: invest } });
        else {
            toast.info('Input value must be bigger than zero.', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    }

    const claim = () => {
        if (Number(stakedTokenAmount) > 0) dispatch({ type: "CLAIM_TOKEN", payload: {} });
        else {
            toast.info('You did not stake.', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    }

    const unstake = () => {
        if (Number(stakedTokenAmount) > 0) dispatch({ type: "UNSTAKE_TOKEN", payload: {} });
        else {
            toast.info('You did not stake.', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    }

    const handleChange = (event) => {
        setInvestAmount(event.target.value);
    }

    const handleConnect = async () => {
        if (window.ethereum) {
            await window.ethereum.enable();
            dispatch({
                type: 'CONNECT_WALLET',
            });
        } else {
            toast.info('Please install metamask on your device', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
        togglePopup();
    }

    const togglePopup = () => {
        setIsOpen(!isOpen);
    };

    const onClickMAX = () => {
        dispatch({ type: "GET_BALANCE_AND_SET_AMOUNT_OF_pPOP_TOKEN", payload: {} });
    }

    const updateReward = () => {
        let time = parseInt(Date.now() / 1000);

        console.log("lastClaim", lastClaim);
        var reward = rewardTokenAmount + stakedTokenAmount * aprRate * (time - lastClaim) / 100 * 3600 * 24 * 365;
        console.log("reward", reward);
        console.log("rewardTokenAmount", rewardTokenAmount);
        reward = parseFloat(reward).toFixed(5);
        setCurrentReward(reward);
    }

    useEffect(() => {
        if (stakingTokenAmount >= 0) setInvestAmount(stakingTokenAmount);
    }, [stakingTokenAmount])

    useEffect(() => {
        if (account) {

            setTimeout(() => {
                setInterval(updateReward, 1000);
            }, 1000);
        }
    }, [lastClaim]);

    useEffect(() => {
        if (account) {
            setTimeout(() => {
                dispatch({ type: "GET_ACCOUNT_INFO", payload: {} });
            }, 500);
        }
    }, [account, dispatch]);

    useEffect(() => {
        console.log("AAA");
        dispatch({ type: "GET_CONTRACT_INFO", payload: {} });
    }, []);

    return (
        <>
            <div className="purchase-form wallet-connection" >
                <div className="purchase-amount">
                    {
                        account ?
                            <div className="account-address">{account.slice(0, 6) + "..." + account.slice(38)}</div>
                            :
                            <button onClick={() => togglePopup()} className="connectWallet">Connect wallet</button>
                    }
                    <div className="newInputs">
                        <div className="leftInputs NewHolder">
                            <div className="amoutToken">
                                <label>Total Staked</label>
                                {
                                    totalStakedAmount > 0 ?
                                        <span>: {totalStakedAmount}</span>
                                        :
                                        <span>: 0 </span>
                                }
                            </div>
                            <div className="amoutToken">
                                <label>Staking</label>
                                {
                                    stakedTokenAmount >= 0 ?
                                        <span>: {stakedTokenAmount}</span>
                                        :
                                        <span>: 0 </span>
                                }
                            </div>
                            <div className="newInputsItem">
                                {/* <input className={returnCoinAmount > 0 ? "input-warning active" : "input-warning"} type="text" placeholder="1000" */}
                                {
                                    account ?
                                        <input className="input-warning " type="text" placeholder="0"
                                            value={invest ?? ""}
                                            onChange={(e) => handleChange(e)} />
                                        :
                                        <input className="input-warning " type="text" placeholder="0"
                                            value={invest ?? ""}
                                            onChange={(e) => handleChange(e)} disabled />
                                }
                                <span className="max_button" onClick={() => onClickMAX()}>MAX</span>
                                <button className="selectDinar">
                                    <div className="optionDinar" >
                                        <div className="imageDinar"><img alt="USDC.e" src="/img/logo.png" /></div>
                                    </div>
                                    <div className="">BRO</div>
                                </button>
                            </div>
                            <PurchaseLimits compact={true} />
                        </div>

                        <div className="rightInputs NewHolder">

                            <div className="amoutToken">
                                <label>Total Claimed</label>
                                {
                                    totalClaimedAmount > 0 ?
                                        <span>: {totalClaimedAmount}</span>
                                        :
                                        <span>: 0 </span>
                                }
                            </div>
                            <div className="amoutToken">
                                <label>Rewards</label>
                                {
                                    currentReward > 0 ?
                                        <span>: {currentReward}</span>
                                        :
                                        <span>: 0 </span>
                                }
                            </div>
                        </div>

                    </div>
                    <button className="connectWallet" onClick={() => stake()}>Stake</button>
                    <button className="connectWallet" onClick={() => claim()}>Claim</button>
                    <button className="connectWallet" onClick={() => unstake()}>Unstake</button>
                </div>
                {isOpen && (
                    <Popup
                        content={
                            <>
                                <div className="connectTitle">Connect a wallet</div>
                                <div className="walletHolder">
                                    <div className="walletItem"><a onClick={() => handleConnect()} href="#root" ><img alt="MetaMask" src="/img/MetaMask_Fox.png" />MetaMask<span className="arrowRightBtn"><i className="fa-solid fa-chevron-right"></i></span></a></div>
                                </div>
                            </>
                        }
                        handleClose={() => togglePopup()}
                    />
                )}
            </div>
        </>
    );
}

export default PurchaseForm;