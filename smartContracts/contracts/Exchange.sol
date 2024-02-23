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
    mapping(uint256 => bool) public ordersFilled;
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
        uint256 id, address user, address tokenToBuy, uint256 amountToBuy, address tokenToSell, uint256 amountToSell, uint256 timestamp
    );
    event CancelledOrder(
        uint256 id, address user, address tokenToBuy, uint256 amountToBuy, address tokenToSell, uint256 amountToSell, uint256 timestamp
    );
    event Trade(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address creator, uint256 timestamp);

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

        ordersCount++;
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

        //validations
        require(_orderId < 0 || _orderId >= ordersCount, "invalid ID for Order");
        require(!ordersCancelled[_orderId], "order is already cancelled");
        require(!ordersFilled[_orderId], "order was filled, it is no longer available");

        _trade(order.id, order.user, order.tokenToBuy, order.amountToBuy, order.tokenToSell, order.amountToSell);

        //2. mark order filled
        ordersFilled[_orderId] = true;



    }

    
    function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
        
        //1. pay fee => msg sender
        uint256 feeVal = (_amountGet * feePercent) / 100;


        tokens[_tokenGet][msg.sender] -= (_amountGet + feeVal);        
        tokens[_tokenGet][_user] += _amountGet;             

        //2. charge fees
        _chargeFee(_tokenGet, feeVal);

        tokens[_tokenGive][_user] -= _amountGive;
        tokens[_tokenGive][msg.sender] += _amountGive;

        emit Trade(
            _orderId,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            _user,
            block.timestamp
        );
    }
    function _chargeFee(address _tokenUsed, uint256 feeAmount) internal {
        tokens[_tokenUsed][feeAccount] += feeAmount;
    }
}