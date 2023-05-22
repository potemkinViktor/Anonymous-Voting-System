// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "zk-merkle-tree/contracts/ZKTree.sol";

contract Vote is ZKTree {
    address internal owner;
    mapping(address => bool) internal validators;
    mapping(uint256 => bool) internal uniqueHashes;
    uint internal numOptions;
    mapping(uint => uint) internal optionCounter;

    constructor(
        uint32 _levels,
        IHasher _hasher,
        IVerifier _verifier,
        uint _numOptions
    ) ZKTree(_levels, _hasher, _verifier) {
        owner = msg.sender;
        numOptions = _numOptions;
        for (uint i = 0; i <= numOptions; i++) optionCounter[i] = 0;
    }

    function registerValidator(address _validator) external {
        require(msg.sender == owner, "Only owner can add validator!");
        validators[_validator] = true;
    }

    function registerCommitment(
        uint256 _uniqueHash,
        uint256 _commitment
    ) external {
        require(validators[msg.sender], "Only validator can commit!");
        require(
            !uniqueHashes[_uniqueHash],
            "This unique hash is already used!"
        );
        _commit(bytes32(_commitment));
        uniqueHashes[_uniqueHash] = true;
    }

    function vote(
        uint _option,
        uint256 _nullifier,
        uint256 _root,
        uint[2] memory _proof_a,
        uint[2][2] memory _proof_b,
        uint[2] memory _proof_c
    ) external {
        require(_option <= numOptions, "Invalid option!");
        _nullify(
            bytes32(_nullifier),
            bytes32(_root),
            _proof_a,
            _proof_b,
            _proof_c
        );
        optionCounter[_option] = optionCounter[_option] + 1;
    }

    function getOptionCounter(uint _option) public view returns (uint) {
        return optionCounter[_option];
    }

    function getOwner() public view returns(address) {
        return owner;
    }

    function getValidator(address key) public view returns(bool) {
        return validators[key];
    }

    function getUniqueHashes(uint256 key) public view returns(bool) {
        return uniqueHashes[key];
    }

    function getNumOptions() public view returns(uint) {
        return numOptions;
    }

    function getWinnerOption() public view returns(uint winner) {
        for (uint256 i = 1; i <= getNumOptions(); i++) {
            if (getOptionCounter(i) > getOptionCounter(i - 1)) {
                winner = i;
            }
        }
    }
}
