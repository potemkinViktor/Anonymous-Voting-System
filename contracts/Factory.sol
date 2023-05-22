// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Vote.sol";

contract FactoryVotes {
    struct VoteInfo {
        address voteAddress;
        address user;
        uint numOptions;
        uint timestamp;
    }

    mapping(address => VoteInfo[]) public userContracts;

    function createVote(
        uint32 _levels,
        IHasher _hasher,
        IVerifier _verifier,
        uint _numOptions
    ) external returns (address) {
        Vote newContract = new Vote(_levels, _hasher, _verifier, _numOptions);
        VoteInfo memory voteInfo = VoteInfo(address(newContract), msg.sender, _numOptions, block.timestamp);
        userContracts[msg.sender].push(voteInfo);
        return address(newContract);
    }

    function getUserContracts(address _user) external view returns (VoteInfo[] memory) {
        return userContracts[_user];
    }

    function batchUserContracts(address[] calldata _users) external view returns (VoteInfo[] memory info) {
        for (uint256 i = 0; i < _users.length; i ++) {
            uint256 size = (userContracts[_users[i]]).length;
            for (uint256 j = 0; j < size; j++) {
                info[i + j] = userContracts[_users[i]][j];
            }
        }
    }
}
