import { createStore } from 'redux'
import Web3 from 'web3';
import config from '../contract/index';
import { toast } from 'react-toastify';

const _initialState = {
    account: "",
    purchaseAllowed: false,

    name: "Bromidian",
    imageUrl: "",
    introTitle: "Stake your $BRO to get more $BRO!",
    introDescription: "Now you have your $BRO and you can now stake them for the $BRO",
    purchasedTitle: "Congratulations!",
    purchasedDescription: "Stake complete. You will get your reward.",
    whitepaperUrl: "https://robromides.com/roadmap/",
    stakingToken: "BRO",
    stakingTokenAmount: 0,
    rewardToken: "BRO",
    rewardTokenAmount: 0,
    stakedTokenAmount: 0,
    totalStakedAmount: 0,
    totalClaimedAmount: 0,
    minInvest: "1 BRO",
    maxInvest: "100000000 BRO",
    transaction: "",
    balanceOfBro: 0,
    aprRate: 0,
    lastClaim: 0
}

const init = (init) => {
    return init;
}

const globalWeb3 = new Web3(config.mainNetUrl);
const provider = Web3.providers.HttpProvider(config.mainNetUrl);
const web3 = new Web3(Web3.givenProvider || provider);

const contract = new web3.eth.Contract(config.contractAbi, config.contractAddress);
const bro = new web3.eth.Contract(config.ERC20Abi, config.broAddress);


console.log("provider", config.mainNetUrl);
console.log("contract", config.contractAddress);
console.log("bro", config.broAddress);

const calcTokenAmount = async (state, stakingTokenAmount) => {
    if (!state.account) {
        alertMsg("Please connect metamask!");
        return;
    }
    try {

        console.log("stakingTokenAmount", stakingTokenAmount);

        var amount = web3.utils.toWei(Number(stakingTokenAmount).toString(), 'ether');
        var tokenAmount = await contract.methods.getAmountOut(amount).call();
        tokenAmount = web3.utils.fromWei(tokenAmount, 'ether');

        store.dispatch({ type: "RETURN_DATA", payload: { stakingTokenAmount: stakingTokenAmount, rewardTokenAmount: tokenAmount } });
    } catch (e) {
        console.log("error: ", e);
        store.dispatch({ type: "RETURN_DATA", payload: { stakingTokenAmount: 0, rewardTokenAmount: 0 } });
    }
}

const stake = async (state, inputAmount) => {
    if (!state.account) {
        alertMsg("Please connect metamask!");
        return;
    }
    try {

        var tokenBalance = await bro.methods.balanceOf(state.account).call();
        tokenBalance = web3.utils.fromWei(tokenBalance, 'ether');
        var stakingAmount = web3.utils.toWei(Number(inputAmount).toString(), 'ether');

        console.log("tokenBalance = ", tokenBalance, " stakingAmount = ", stakingAmount, " inputAmount = ", inputAmount);

        if (tokenBalance - inputAmount >= 0) {
            await bro.methods.approve(config.contractAddress, stakingAmount).send({ from: state.account });
            await contract.methods.stake(stakingAmount).send({ from: state.account });


            store.dispatch({
                type: "RETURN_DATA",
                payload: {
                    stakingTokenAmount: inputAmount,
                }
            });
        }
        else {
            alertMsg("You don't have enough BRO.");
            store.dispatch({ type: "RETURN_DATA", payload: {} });
        }
    } catch (e) {
        console.log("Error on Stake : ", e);
        store.dispatch({ type: "RETURN_DATA", payload: {} });
    }
}

const claim = async (state) => {
    if (!state.account) {
        alertMsg("Please connect metamask!");
        return;
    }
    try {

        await contract.methods.claim().send({ from: state.account });
        store.dispatch({
            type: "RETURN_DATA",
            payload: {},
        });
    } catch (e) {
        console.log("Error on Stake : ", e);
        store.dispatch({ type: "RETURN_DATA", payload: {} });
    }
}

const unstake = async (state) => {
    if (!state.account) {
        alertMsg("Please connect metamask!");
        return;
    }
    try {

        await contract.methods.unstake().send({ from: state.account });
        store.dispatch({
            type: "RETURN_DATA",
            payload: {},
        });
    } catch (e) {
        console.log("Error on Stake : ", e);
        store.dispatch({ type: "RETURN_DATA", payload: {} });
    }
}

export const getAccountInfo = async (state) => {
    if (!state.account) {
        alertMsg("Please connect metamask!");
        return;
    }
    try {

        var broBalance = await bro.methods.balanceOf(state.account).call();
        broBalance = globalWeb3.utils.fromWei(broBalance, 'ether');
        console.log("broBalance = ", broBalance);

        var stakeStatus = await contract.methods.getStatus(state.account).call();
        console.log("stakeStatus = ", stakeStatus);
        stakeStatus.stakedAmount = globalWeb3.utils.fromWei(stakeStatus.stakedAmount, 'ether');
        stakeStatus.rewardAmount = globalWeb3.utils.fromWei(stakeStatus.rewardAmount, 'ether');

        store.dispatch({
            type: "UPDATE_ACCOUNT_INFO",
            payload: {
                tokenBalance: parseFloat(broBalance).toFixed(2),
                stakedAmount: parseFloat(stakeStatus.stakedAmount).toFixed(2),
                rewardAmount: parseFloat(stakeStatus.rewardAmount).toFixed(2),
                lastClaim: parseInt(stakeStatus.lastClaim),
            }
        })
    } catch (e) {
        console.log("Error on getBalanceOfRealToken : ", e);
        store.dispatch({ type: "RETURN_DATA", payload: {} });
    }
}

export const getContractInfo = async (state) => {
    if (contract === undefined) {
        alertMsg("Please install metamask!");
        return;
    }
    try {

        var stakedBalance = await contract.methods.totalStaked().call();
        stakedBalance = globalWeb3.utils.fromWei(stakedBalance.toString(), 'ether');

        var claimedBalance = await contract.methods.totalClaimed().call();
        claimedBalance = globalWeb3.utils.fromWei(claimedBalance.toString(), 'ether');

        var aprRate = await contract.methods.getAprRate().call();

        store.dispatch({
            type: "UPDATE_CONTRACT_INFO",
            payload: {
                stakedBalance: parseFloat(stakedBalance).toFixed(2),
                claimedBalance: parseFloat(claimedBalance).toFixed(2),
                aprRate: aprRate,
            }
        })
    } catch (e) {
        console.log("Error on getContractInfo : ", e);
        store.dispatch({ type: "RETURN_DATA", payload: {} });
    }
}

const reducer = (state = init(_initialState), action) => {
    switch (action.type) {
        case "GET_CONTRACT_INFO":
            getContractInfo(state);
            break;
        case "UPDATE_CONTRACT_INFO":
            state = {
                ...state,
                totalStakedAmount: action.payload.stakedBalance,
                totalClaimedAmount: action.payload.claimedBalance,
                aprRate: action.payload.aprRate,
            };
            break;
        case "UPDATE_ACCOUNT_INFO":
            state = {
                ...state,
                balanceOfBro: action.payload.broBalance,
                stakedTokenAmount: action.payload.stakedAmount,
                rewardTokenAmount: action.payload.rewardAmount,
                lastClaim: action.payload.lastClaim,
            };
            break;
            if (action.payload.flag === true) {
                state = {
                    ...state,
                    balanceOfMatic: action.payload.maticBalance
                };
            }
            else {
                state = {
                    ...state,
                    balanceOfMatic: action.payload.maticBalance,
                    stakingTokenAmount: action.payload.maticBalance
                };
                calcTokenAmount(state, action.payload.maticBalance);
            }
            break;
        case "GET_ACCOUNT_INFO":
            if (!checkNetwork(state.chainId)) {
                changeNetwork();
                return state;
            }
            getAccountInfo(state);
            break;
        case "GET_BALANCE_AND_SET_AMOUNT_OF_pPOP_TOKEN":
            if (!checkNetwork(state.chainId)) {
                changeNetwork();
                return state;
            }
            break;
        case "STAKE_TOKEN":
            if (!checkNetwork(state.chainId)) {
                changeNetwork();
                return state;
            }
            stake(state, action.payload.stakingTokenAmount);
            break;
        case "CLAIM_TOKEN":
            console.log("error");
            if (!checkNetwork(state.chainId)) {
                changeNetwork();
                return state;
            }
            claim(state, action.payload.stakingTokenAmount);
            break;
        case "UNSTAKE_TOKEN":
            if (!checkNetwork(state.chainId)) {
                changeNetwork();
                return state;
            }
            unstake(state, action.payload.stakingTokenAmount);
            break;

        case 'CONNECT_WALLET':
            if (!checkNetwork(state.chainId)) {
                changeNetwork();
                return state;
            }
            web3.eth.getAccounts((err, accounts) => {
                store.dispatch({
                    type: 'RETURN_DATA',
                    payload: { account: accounts[0], purchaseAllowed: true, stakingTokenAmount: 0, rewardTokenAmount: null }
                });
            })
            break;
        case 'CHANGE_ACCOUNT':
            if (!checkNetwork(state.chainId)) {
                changeNetwork();
                return state;
            }
            state = {
                ...state,
                stakingTokenAmount: 0,
                rewardTokenAmount: 0,
            };
            return state;
        case 'RETURN_DATA':
            return Object.assign({}, state, action.payload);

        default:
            break;
    }
    return state;
}

const alertMsg = (msg) => {
    toast.info(msg, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    });
}

const checkNetwork = (chainId) => {
    if (web3.utils.toHex(chainId) !== web3.utils.toHex(config.chainId)) {
        alertMsg("Change network to Polygon Mainnet!");
        return false;
    } else {
        return true;
    }
}

const changeNetwork = async () => {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: config.chainId }],
        });
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: config.chainId,
                            chainName: 'Avalanche',
                            rpcUrls: [config.mainNetUrl] /* ... */,
                        },
                    ],
                });
            } catch (addError) {
            }
        }
    }
}


if (window.ethereum) {

    window.ethereum.on('accountsChanged', function (accounts) {
        store.dispatch({
            type: "RETURN_DATA",
            payload: { account: accounts[0] }
        });
        store.dispatch({
            type: "CHANGE_ACCOUNT",
            payload: { account: accounts[0] }
        });
    })

    window.ethereum.on('chainChanged', function (chainId) {
        checkNetwork(chainId);
        store.dispatch({
            type: "RETURN_DATA",
            payload: { chainId: chainId }
        });
    });

    web3.eth.getChainId().then((chainId) => {
        checkNetwork(chainId);
        store.dispatch({
            type: "RETURN_DATA",
            payload: { chainId: chainId }
        });
    })
}

const store = createStore(reducer);
export default store