// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9; // ^0.8.0;

// import "hardhat/console.sol";

contract Token {
    string public name; // = "My Token";
    string public symbol; // = "DAPP";
    uint256 public decimals = 18;
    uint256 public totalSupply; // = 1000000 * (10 ** decimals); // = 1 000 000

    mapping(address => uint256) public balanceOf;
    //owner             //spender
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

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
}
