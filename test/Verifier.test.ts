import { ethers } from "hardhat";
import { expect } from "chai";
import { Pairing__factory, Pairing } from "../typechain";

describe("Pairing contract", function () {
  let pairing: Pairing;

  beforeEach(async function () {
    const factory = (await ethers.getContractFactory(
      "Pairing"
    )) as Pairing__factory;
    pairing = await factory.deploy();
  });

  it("should add two points correctly", async function () {
    const p1 = { X: 3, Y: 4 };
    const p2 = { X: 2, Y: 5 };
    const expected = { X: 5, Y: 0 };

    const result = await pairing.addition(p1, p2);

    expect(result).to.deep.equal(expected);
  });

  it("should negate a point correctly", async function () {
    const p = { X: 3, Y: 4 };
    const expected = {
      X: 3,
      Y: 21888242871839275222246405745257275088696311157297823662689037894645226208579,
    };

    const result = await pairing.negate(p);

    expect(result).to.deep.equal(expected);
  });

  it("should scalar multiply a point correctly", async function () {
    const p = { X: 3, Y: 4 };
    const s = 5;
    const expected = {
      X: 21817298385435845187866423467870356413319732964554362201200803416706794648928,
      Y: 6476209829095821334707548436506881549702001787173875787129401751863632810669,
    };

    const result = await pairing.scalar_mul(p, s);

    expect(result).to.deep.equal(expected);
  });

  it("should check pairing correctly", async function () {
    const p1 = [
      { X: 1, Y: 2 },
      { X: 3, Y: 4 },
    ];
    const p2 = [
      {
        X: [
          11559732032986387107991004021392285783925812861821192530917403151452391805634,
          10857046999023057135944570762232829481370756359578518086990519993285655852781,
        ],
        Y: [
          4082367875863433681332203403145435568316851327593401208105741076214120093531,
          8495653923123431417604973247489272438418190587263600148770280649306958101930,
        ],
      },
      {
        X: [
          12623981093529297811592795440556916332152627681365585961155223559685317870299,
          18454937603337218674455881075897601955491279027326184678846403196817384281992,
        ],
        Y: [
          1917725148804502947097955756941785610190543234038743038260825796810475764530,
          1933937151057647945729335973036523017066367221787844784541668068447736450006,
        ],
      },
    ];
    const expected = true;

    const result = await pairing.pairing(p1, p2);

    expect(result).to.equal(expected);
  });

  it("Correct mint and all functions", async function () {
    const { aayc, owner, user1, user2, user3 } = await loadFixture(deploy);

    const whitelistFirstAddresses = [owner.address, user1.address];
    const merkleTreeFirst = generateTree(whitelistFirstAddresses);

    let whitelistSecondAddresses = [
      owner.address,
      user1.address,
      user2.address,
    ];
    const merkleTreeSecond = generateTree(whitelistSecondAddresses);

    expect(
      await aayc.connect(owner).setMerkleRootFirst(merkleTreeFirst.getHexRoot())
    ).to.be.ok;
    expect(
      await aayc
        .connect(owner)
        .setMerkleRootSecond(merkleTreeSecond.getHexRoot())
    ).to.be.ok;

    expect(await aayc.balanceOf(owner.address)).to.equal(0);
    expect(await aayc.balanceOf(user1.address)).to.equal(0);
    expect(await aayc.balanceOf(user2.address)).to.equal(0);
    expect(await aayc.balanceOf(user3.address)).to.equal(0);

    const hexProofOwnerFirst = getProof(merkleTreeFirst, owner.address);
    const hexProofUser1First = getProof(merkleTreeFirst, user1.address);
    const hexProofUser2First = getProof(merkleTreeFirst, user2.address);
    const hexProofUser3First = getProof(merkleTreeFirst, user3.address);

    const hexProofOwnerSecond = getProof(merkleTreeSecond, owner.address);
    const hexProofUser1Second = getProof(merkleTreeSecond, user1.address);
    const hexProofUser2Second = getProof(merkleTreeSecond, user2.address);
    const hexProofUser3Second = getProof(merkleTreeSecond, user3.address);

    const provider = ethers.provider;
    expect(await provider.getBalance(aayc.address)).to.equal(0);

    await expect(
      aayc
        .connect(user1)
        .mintWhitelistFirst(2, hexProofUser1First, { value: ether("0.1") })
    ).to.be.revertedWith("Sale is closed");
    await expect(
      aayc
        .connect(user1)
        .mintWhitelistSecond(2, hexProofUser1First, { value: ether("0.1") })
    ).to.be.revertedWith("Sale is closed");
    await expect(
      aayc.connect(user1).mintPublic(1, { value: ether("0.2") })
    ).to.be.revertedWith("Sale is closed");
    expect(await aayc.getStage()).to.equal(0);
    expect(await aayc.connect(owner).toggleSale()).to.be.ok;
    expect(await aayc.getStage()).to.equal(0);
    await expect(
      aayc
        .connect(user1)
        .mintWhitelistFirst(2, hexProofUser1First, { value: ether("0.1") })
    ).to.be.revertedWith("Sale is closed");
    await expect(
      aayc
        .connect(user1)
        .mintWhitelistSecond(2, hexProofUser1First, { value: ether("0.1") })
    ).to.be.revertedWith("Sale is closed");
    await expect(
      aayc.connect(user1).mintPublic(1, { value: ether("0.2") })
    ).to.be.revertedWith("Sale is closed");
    // whitelist first
    await expect(
      aayc
        .connect(user1)
        .mintWhitelistFirst(2, hexProofUser1First, { value: ether("0.1") })
    ).to.be.revertedWith("Sale is closed");
    await time.increase(60 * 60);
    expect(await aayc.getStage()).to.equal(1);
    await expect(
      aayc.connect(user1).mintPublic(1, { value: ether("0.2") })
    ).to.be.revertedWith("Sale is closed");

    await expect(
      aayc
        .connect(user1)
        .mintWhitelistFirst(3, hexProofUser1First, { value: ether("0.3") })
    ).to.be.revertedWith("Maximum balance exceeded");
    await expect(
      aayc
        .connect(user1)
        .mintWhitelistFirst(2, hexProofUser1First, { value: ether("0.01") })
    ).to.be.revertedWith("Not enough funds");
    await expect(
      aayc
        .connect(user2)
        .mintWhitelistFirst(2, hexProofUser2First, { value: ether("0.2") })
    ).to.be.revertedWith("Invalid Merkle Proof");
    expect(
      await aayc
        .connect(user1)
        .mintWhitelistFirst(1, hexProofUser1First, { value: ether("0.1") })
    );
    expect(
      await aayc
        .connect(user1)
        .mintWhitelistFirst(1, hexProofUser1First, { value: ether("0.1") })
    );
    expect(
      await aayc
        .connect(owner)
        .mintWhitelistFirst(2, hexProofOwnerFirst, { value: ether("0.2") })
    );
    await expect(
      aayc
        .connect(user1)
        .mintWhitelistFirst(1, hexProofUser1First, { value: ether("0.1") })
    ).to.be.revertedWith("Maximum balance exceeded");
    expect(await aayc.balanceOf(user1.address)).to.equal(2);
    expect(await aayc.balanceOf(owner.address)).to.equal(2);
    // whitelist second
    await expect(
      aayc
        .connect(user1)
        .mintWhitelistSecond(2, hexProofUser1Second, { value: ether("0.3") })
    ).to.be.revertedWith("Sale is closed");
    expect(await aayc.getStage()).to.equal(1);
    await time.increase(60 * 60);
    expect(await aayc.getStage()).to.equal(2);
    await expect(
      aayc.connect(user1).mintPublic(1, { value: ether("0.2") })
    ).to.be.revertedWith("Sale is closed");

    await expect(
      aayc
        .connect(user1)
        .mintWhitelistSecond(4, hexProofUser1Second, { value: ether("0.6") })
    ).to.be.revertedWith("Maximum balance exceeded");
    await expect(
      aayc
        .connect(user1)
        .mintWhitelistSecond(1, hexProofUser1Second, { value: ether("0.01") })
    ).to.be.revertedWith("Not enough funds");
    await expect(
      aayc
        .connect(user3)
        .mintWhitelistSecond(2, hexProofUser3Second, { value: ether("0.3") })
    ).to.be.revertedWith("Invalid Merkle Proof");
    expect(
      await aayc
        .connect(user1)
        .mintWhitelistSecond(3, hexProofUser1Second, { value: ether("0.45") })
    );
    expect(
      await aayc
        .connect(owner)
        .mintWhitelistSecond(3, hexProofOwnerSecond, { value: ether("0.45") })
    );
    expect(
      await aayc
        .connect(user2)
        .mintWhitelistSecond(3, hexProofUser2Second, { value: ether("0.45") })
    );
    await expect(
      aayc
        .connect(user1)
        .mintWhitelistSecond(1, hexProofUser1Second, { value: ether("0.15") })
    ).to.be.revertedWith("Maximum balance exceeded");
    await expect(
      aayc
        .connect(user2)
        .mintWhitelistSecond(1, hexProofUser2Second, { value: ether("0.15") })
    ).to.be.revertedWith("Maximum balance exceeded");
    expect(await aayc.balanceOf(owner.address)).to.equal(5);
    expect(await aayc.balanceOf(user1.address)).to.equal(5);
    expect(await aayc.balanceOf(user2.address)).to.equal(3);
    // public
    await expect(
      aayc.connect(user1).mintPublic(1, { value: ether("0.2") })
    ).to.be.revertedWith("Sale is closed");
    await time.increase(60 * 60);
    expect(await aayc.getStage()).to.equal(3);
    await expect(
      aayc.connect(user1).mintPublic(5, { value: ether("0.6") })
    ).to.be.revertedWith("Maximum per tx exceeded");
    await expect(
      aayc.connect(user1).mintPublic(1, { value: ether("0.01") })
    ).to.be.revertedWith("Not enough funds");
    expect(await aayc.connect(user1).mintPublic(4, { value: ether("0.8") }));
    await expect(
      aayc.connect(user2).mintPublic(2, { value: ether("0.4") })
    ).to.be.revertedWith("Maximum supply exceeded");
    expect(await aayc.connect(user3).mintPublic(1, { value: ether("0.2") }));
    expect(await aayc.balanceOf(owner.address)).to.equal(5);
    expect(await aayc.balanceOf(user1.address)).to.equal(9);
    expect(await aayc.balanceOf(user2.address)).to.equal(3);
    expect(await aayc.balanceOf(user3.address)).to.equal(1);
    const balanceBefore = await provider.getBalance(aayc.address);
    await expect(aayc.connect(user1).withdraw(1)).to.be.revertedWith(
      "Ownable: caller is not the owner'"
    );
    expect(await aayc.connect(owner).withdraw(ether("1"))).to.be.ok;
    const balanceAfter = await provider.getBalance(aayc.address);
    expect(await aayc.connect(owner).withdraw(0)).to.be.ok;
    expect(balanceBefore.sub(balanceAfter)).to.equal(ether("1"));
    expect(await aayc.totalSupply()).to.equal(18);

    await expect(aayc.connect(user1).withdrawTeamNFTs(8)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(aayc.connect(owner).withdrawTeamNFTs(9)).to.be.revertedWith(
      "Not enough team supply"
    );
    expect(await aayc.connect(owner).withdrawTeamNFTs(8)).to.ok;
    console.log(await aayc.totalSupply());
    expect(await aayc.balanceOf(owner.address)).to.equal(13);
  });

  it("Correct mint and all functions", async function () {
    let whitelistFirstAddresses = [owner.address, user1.address];

    const leafNodesFirst = whitelistFirstAddresses.map((addr) =>
      keccak256(addr)
    );
    const merkleTreeFirst = new MerkleTree(leafNodesFirst, keccak256, {
      sortPairs: true,
    });
    const rootHashFirst = merkleTreeFirst.getRoot().toString("hex");
    console.log("Whitelist Merkle Tree\n", merkleTreeFirst.toString());
    console.log("Root Hash: ", "0x" + rootHashFirst);

    // Second
    let whitelistSecondAddresses = [
      owner.address,
      user1.address,
      user2.address,
    ];

    const leafNodesSecond = whitelistSecondAddresses.map((addr) =>
      keccak256(addr)
    );
    const merkleTreeSecond = new MerkleTree(leafNodesSecond, keccak256, {
      sortPairs: true,
    });
    const rootHashSecond = merkleTreeSecond.getRoot().toString("hex");
    console.log("Whitelist Merkle Tree\n", merkleTreeSecond.toString());
    const rootHashSecond = merkleTreeSecond.getRoot().toString("hex");
    console.log("Root Hash: ", "0x" + rootHashSecond);

    AAYC = await ethers.getContractFactory("AAYC");
    aayc = await AAYC.deploy(
      2,
      3,
      4,
      ether("0.1"),
      ether("0.15"),
      ether("0.2"),
      8,
      "0x" + rootHashFirst,
      "0x" + rootHashSecond
    );
    await aayc.deployed();

    expect(await aayc.balanceOf(owner.address)).to.equal(0);
    expect(await aayc.balanceOf(user1.address)).to.equal(0);
    expect(await aayc.balanceOf(user2.address)).to.equal(0);
    expect(await aayc.balanceOf(user3.address)).to.equal(0);

    const claimingAddressOwner = keccak256(owner.address);
    const claimingAddressUser1 = keccak256(user1.address);
    const claimingAddressUser2 = keccak256(user2.address);
    const claimingAddressUser3 = keccak256(user3.address);

    const hexProofOwnerFirst =
      merkleTreeFirst.getHexProof(claimingAddressOwner);
    const hexProofUser1First =
      merkleTreeFirst.getHexProof(claimingAddressUser1);
    const hexProofUser2First =
      merkleTreeFirst.getHexProof(claimingAddressUser2);
    const hexProofUser3First =
      merkleTreeFirst.getHexProof(claimingAddressUser3);
    const hexProofOwnerSecond =
      merkleTreeSecond.getHexProof(claimingAddressOwner);
    const hexProofUser1Second =
      merkleTreeSecond.getHexProof(claimingAddressUser1);
    const hexProofUser2Second =
      merkleTreeSecond.getHexProof(claimingAddressUser2);
    const hexProofUser3Second =
      merkleTreeSecond.getHexProof(claimingAddressUser3);

    const provider = ethers.provider;
    expect(await provider.getBalance(aayc.address)).to.equal(0);
    console.log(await aayc.totalSupply());

    await expect(aayc.connect(user1).withdrawCompanyNFTs(8)).to.be.revertedWith(
      "Not owner"
    );
    await expect(aayc.connect(owner).withdrawCompanyNFTs(9)).to.be.revertedWith(
      "Not enough company supply"
    );
    expect(await aayc.connect(owner).withdrawCompanyNFTs(8)).to.ok;
    console.log(await aayc.totalSupply());

    expect(await aayc.connect(owner).flipWhitelistFirst()).to.be.ok;
    expect(
      await aayc
        .connect(user1)
        .mintWhitelistFirst(1, hexProofUser1First, { value: ether("0.1") })
    );
    expect(
      await aayc
        .connect(user1)
        .mintWhitelistFirst(1, hexProofUser1First, { value: ether("0.1") })
    );
    expect(
      await aayc
        .connect(owner)
        .mintWhitelistFirst(2, hexProofOwnerFirst, { value: ether("0.2") })
    );
    expect(await aayc.balanceOf(user1.address)).to.equal(2);
    expect(await aayc.balanceOf(owner.address)).to.equal(10);

    expect(await aayc.connect(owner).flipWhitelistSecond()).to.be.ok;
    expect(
      await aayc
        .connect(user1)
        .mintWhitelistSecond(3, hexProofUser1Second, { value: ether("0.45") })
    );
    expect(
      await aayc
        .connect(owner)
        .mintWhitelistSecond(3, hexProofOwnerSecond, { value: ether("0.45") })
    );
    expect(
      await aayc
        .connect(user2)
        .mintWhitelistSecond(3, hexProofUser2Second, { value: ether("0.45") })
    );
    expect(await aayc.balanceOf(owner.address)).to.equal(13);
    expect(await aayc.balanceOf(user1.address)).to.equal(5);
    expect(await aayc.balanceOf(user2.address)).to.equal(3);

    expect(await aayc.connect(owner).flipSale()).to.be.ok;
    expect(await aayc.connect(user1).mintPublic(4, { value: ether("0.8") }));
    expect(await aayc.connect(user3).mintPublic(1, { value: ether("0.2") }));
    expect(await aayc.balanceOf(owner.address)).to.equal(13);
    expect(await aayc.balanceOf(user1.address)).to.equal(9);
    expect(await aayc.balanceOf(user2.address)).to.equal(3);
    expect(await aayc.balanceOf(user3.address)).to.equal(1);

    await expect(
      aayc.connect(user2).mintPublic(2, { value: ether("0.4") })
    ).to.be.revertedWith("Maximum supply exceeded");
  });
});
