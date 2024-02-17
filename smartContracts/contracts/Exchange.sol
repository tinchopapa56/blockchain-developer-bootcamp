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

    //Deposit
    function depositToken(address _token, uint256 _amount) public {
        //transf tokens to exchange
        bool successTx = Token(_token).transferFrom(msg.sender, address(this), _amount);
        require(successTx, "token approval failed");

        //update user balance
        tokens[_token][msg.sender] += _amount;

        //event
        uint256 newBalance = balanceOf(_token, address(msg.sender));
        emit Deposit(_token, msg.sender, _amount, newBalance);

    }
    function balanceOf(address _token, address _user) public view returns (uint256) 
    {
        return tokens[_token][_user];
    }
    //withdraw
    //check balance

    //make orders
    //cancel
    //fill orders

    //charge fees
    //track fee account
}

/*

constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply / 10;
    }

    function transfer(
        address _to,
        uint256 _value
    ) public returns (bool success) {
        bool sufficientBalance = balanceOf[msg.sender] >= _value;
        require(sufficientBalance, "Insufficient balance");

        _transfer(msg.sender, _to, _value);

        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {

        bool senderHasEnoughTokens = _value <= balanceOf[_from];
        bool senderHasEnoughAllowance = _value <= allowance[_from][msg.sender];
        require(senderHasEnoughAllowance);
        require(senderHasEnoughTokens);

        allowance[_from][msg.sender] = allowance[_from][msg.sender] - _value;

        _transfer(_from, _to, _value);

        return true;
    }

    function _transfer(address _from, address _to, uint256 _value) internal {
        require(_to != address(0), "Invalid recipient address");

        balanceOf[_from] = balanceOf[_from] - _value;
        balanceOf[_to] = balanceOf[_to] + _value;

        emit Transfer(_from, _to, _value);
    }

    function approve(
        address _spender,
        uint256 _value
    ) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;

        require(_spender != address(0), "Invalid spender");

        emit Approval(msg.sender, _spender, _value);

        return true;
    }



*/
