// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9; // ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => Order) public orders;
    mapping(uint256 => bool) public ordersCancelled;
    mapping(address => Order) public ordersOf;
    uint256 public ordersCount;

    struct Order {
        uint256 id;
        address user;

        address tokenToBuy;
        uint256 amountToBuy;
        address tokenToSell;
        uint256 amountToSell;

        uint256 timestamp;
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdrawal(address token, address user, uint256 amount, uint256 balance);
    event CreatedOrder(
        uint256 id, address user,address tokenToBuy, uint256 amountToBuy, address tokenToSell, uint256 amountToSell,uint256 timestamp
    );
    event CancelledOrder(
        uint256 id, address user,address tokenToBuy, uint256 amountToBuy, address tokenToSell, uint256 amountToSell,uint256 timestamp
    );

    function withdrawToken(address _token, uint256 _amount) public {

        require(tokens[_token][msg.sender] >= _amount, "insufficient balance for witdhrawal");
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

    function balanceOf(address _token, address _user) public view returns (uint256) {
        return tokens[_token][_user];
    }

    function makeOrder(address _tokenToBuy, uint256 _amountToBuy, address _tokenToSell, uint256 _amountToSell) public returns (bool) {
        bool hasEnoughBalance = balanceOf(_tokenToSell,msg.sender) >= _amountToSell;
        require(hasEnoughBalance, "You have Insufficient balance for making order");

        ordersCount += 1;
        orders[ordersCount] = Order(ordersCount, msg.sender, _tokenToBuy, _amountToBuy, _tokenToSell, _amountToSell, block.timestamp);
        emit CreatedOrder(ordersCount, msg.sender, _tokenToBuy, _amountToBuy, _tokenToSell, _amountToSell, block.timestamp);
        return true;
    }

    function cancelOrder(uint256 _orderId) public {
        Order storage order = orders[_orderId];

        bool orderExists = order.id == _orderId;
        require(orderExists, "order id doesnt exist");

        bool isOrderCreator = address(order.user) == msg.sender;
        require(isOrderCreator, "only order creator can cancel it");

        ordersCancelled[_orderId] = true;

        emit CancelledOrder(order.id, msg.sender, order.tokenToBuy, order.amountToBuy, order.tokenToSell, order.amountToSell, block.timestamp);

    }
    function fillOrder(uint256 _orderId) public {
        Order storage order = orders[_orderId];

        bool orderExists = order.id == _orderId;
        require(orderExists, "order id doesnt exist");

        bool isOrderCreator = address(order.user) == msg.sender;
        require(isOrderCreator, "only order creator can cancel it");

        ordersCancelled[_orderId] = true;

    }
}