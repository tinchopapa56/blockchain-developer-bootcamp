// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9; // ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdrawal(address token, address user, uint256 amount, uint256 balance);

    function withdrawToken(address _token, uint256 _amount) public {

        require(tokens[_token][msg.sender] >= _amount, "insufficient balance");
        //transfer tokens to user
        Token(_token).transfer(msg.sender, _amount);
        //update user balance
        tokens[_token][msg.sender] -= _amount;
        //event
        emit Withdrawal(_token, msg.sender, _amount, tokens[_token][msg.sender] );
    }

    function depositToken(address _token, uint256 _amount) public {
        //transf tokens to exchange
        bool successTx = Token(_token).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(successTx, "token approval failed");

        //update user balance
        tokens[_token][msg.sender] += _amount;

        //event
        uint256 newBalance = balanceOf(_token, address(msg.sender));
        emit Deposit(_token, msg.sender, _amount, newBalance);
    }

    function balanceOf(
        address _token,
        address _user
    ) public view returns (uint256) {
        return tokens[_token][_user];
    }
    /////////////////////////////////////

    //make orders
    //cancel
    //fill orders

    //charge fees
    //track fee account
}