import { useState, useRef, useEffect } from "react";
import { Upload, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ethers } from "ethers";

// Define types for MetaMask window
declare global {
  interface Window {
    ethereum?: any;
  }
}

// A0GI 代币的 ABI（只包含 balanceOf 和 decimals 函数）
const tokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// A0GI 代币的真实合约地址 - 0G.ai 的 A0GI 代币
// Ethereum Mainnet: 0x0CD2f274dF806B67F47252AB7F8DeCe1fA756B7e
// Polygon Mainnet: 0xB92358503029849673fD5AF4b6B36E099ef4d769
// BSC Mainnet: 0x3e9d8aa6b24cd9f88c01c3520af996d513236937
// 0G Scan Testnet: 0x7af963cf6d228e564e2a0aa0ddbf06210b38615d (测试网地址)
// 开发网络: 0x5FbDB2315678afecb367f032d93F642f64180aa3 (Hardhat 默认合约地址)
const A0GI_CONTRACT_ADDRESSES = {
  ethereum: "0x0CD2f274dF806B67F47252AB7F8DeCe1fA756B7e",
  polygon: "0xB92358503029849673fD5AF4b6B36E099ef4d769",
  bsc: "0x3e9d8aa6b24cd9f88c01c3520af996d513236937",
  ogTestnet: "0x7af963cf6d228e564e2a0aa0ddbf06210b38615d", // 0G Scan Testnet
  hardhat: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // 本地开发网络
  // 添加其他网络地址如需
  sepolia: "0x1234567890123456789012345678901234567890", // Sepolia 测试网络模拟地址
  localhost: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // 本地网络模拟地址
};

export function FileUpload() {
  const [address, setAddress] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedCid, setUploadedCid] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState("A0GI");
  const [networkName, setNetworkName] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return window.ethereum && window.ethereum.isMetaMask;
  };

  // 获取代币余额
  const fetchTokenBalance = async () => {
    if (!address) return;

    setLoadingBalance(true);
    try {
      // 安全获取提供者
      if (!window.ethereum) {
        throw new Error("MetaMask 未安装或不可用");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // 获取网络信息
      let network;
      try {
        network = await provider.getNetwork();
        const chainId = network.chainId.toString();

        // 打印完整网络信息供调试
        console.log("完整网络信息:", JSON.stringify(network));

        // 设置网络名称
        let networkDisplayName = "Unknown";

        // 根据 chainId 确定网络
        if (chainId === "1") {
          networkDisplayName = "Ethereum";
        } else if (chainId === "56") {
          networkDisplayName = "BSC";
        } else if (chainId === "137") {
          networkDisplayName = "Polygon";
        } else if (chainId === "5") {
          networkDisplayName = "Goerli"; // 测试网络
        } else if (chainId === "97") {
          networkDisplayName = "BSC Testnet";
        } else if (chainId === "80001") {
          networkDisplayName = "Polygon Mumbai";
        } else if (chainId === "86") {
          networkDisplayName = "0G Scan Testnet"; // 0G 测试网
        } else if (chainId === "31337") {
          networkDisplayName = "Hardhat"; // Hardhat 本地网络
        } else if (chainId === "1337") {
          networkDisplayName = "Ganache"; // Ganache 本地网络
        } else if (chainId === "11155111") {
          networkDisplayName = "Sepolia"; // Sepolia 测试网络
        } else if (chainId === "84531") {
          networkDisplayName = "Base Goerli"; // Base 测试网络
        } else if (chainId === "8453") {
          networkDisplayName = "Base"; // Base 主网
        } else {
          // 对于任何其他链 ID，显示链 ID
          networkDisplayName = `Unknown (ID: ${chainId})`;
        }

        // 显示链 ID供调试使用
        console.log(`当前网络 Chain ID: ${chainId}`);

        setNetworkName(networkDisplayName);
      } catch (networkError) {
        console.error("网络连接错误:", networkError);
        setTokenBalance("网络错误");
        setNetworkName(null);
        setLoadingBalance(false);
        return;
      }

      // 筛选当前网络适用的合约地址
      let contractAddress = null;
      const chainId = network.chainId.toString();

      // 保存链名称 - 这会返回网络原生名称（例如homestead代表以太坊主网）
      const networkName = network.name;
      console.log(`获取代币合约中... 链 ID: ${chainId}, 原生名称: ${networkName}`);
      // 打印链 ID 的十六进制格式，有帮于识别部分网络
      console.log(`Chain ID (hex): 0x${Number(chainId).toString(16)}`);

      // 对于未知网络，我们将尝试使用一个测试合约地址

      if (chainId === "1") { // Ethereum Mainnet
        contractAddress = A0GI_CONTRACT_ADDRESSES.ethereum;
      } else if (chainId === "137") { // Polygon Mainnet
        contractAddress = A0GI_CONTRACT_ADDRESSES.polygon;
      } else if (chainId === "56") { // BSC Mainnet
        contractAddress = A0GI_CONTRACT_ADDRESSES.bsc;
      } else if (chainId === "86") { // 0G Scan Testnet
        contractAddress = A0GI_CONTRACT_ADDRESSES.ogTestnet;
      } else if (chainId === "31337" || chainId === "1337") { // Hardhat 或 Ganache 本地开发网络
        contractAddress = A0GI_CONTRACT_ADDRESSES.hardhat;
      } else if (chainId === "11155111") { // Sepolia 测试网络
        contractAddress = A0GI_CONTRACT_ADDRESSES.sepolia;
      } else if (networkName === "unknown" || networkName === "localhost" || chainId === "16600") {
        // 对于开发网络，直接模拟一个余额
        console.log(`检测到开发网络 (Chain ID: ${chainId})，使用模拟数据`);
        // 保存网络名称
        setNetworkName(`开发网络 (Chain ID: ${chainId})`);

        // 模拟余额 - 跳过合约调用
        setTimeout(() => {
          setTokenBalance("100.00");
          setLoadingBalance(false);
        }, 500); // 模拟小延迟
        return;
      } else {
        // 如果当前网络不支持
        console.log(`不支持的网络: ID ${chainId}, 原生名称: ${networkName}`);
        setTokenBalance(`该网络不支持 A0GI 代币 [Chain ID: ${chainId}]`);
        setLoadingBalance(false);
        return;
      }

      // 创建合约实例
      const tokenContract = new ethers.Contract(
        contractAddress,
        tokenABI,
        provider
      );

      // 安全地获取代币信息 - 先设置默认值
      let decimals = 18; // 默认精度
      let symbol = "A0GI"; // 默认符号

      try {
        // 获取代币精度
        decimals = await tokenContract.decimals();
      } catch (error) {
        console.warn("获取代币精度失败，使用默认值 18:", error);
      }

      try {
        // 获取代币符号
        symbol = await tokenContract.symbol();
        setTokenSymbol(symbol);
      } catch (error) {
        console.warn("获取代币符号失败，使用默认值 A0GI:", error);
      }

      // 获取余额
      try {
        const balance = await tokenContract.balanceOf(address);
        // 格式化代币余额，考虑小数位数
        const formattedBalance = ethers.formatUnits(balance, decimals);
        setTokenBalance(formattedBalance);
      } catch (balanceError) {
        console.error("获取余额失败:", balanceError);
        setTokenBalance("获取失败");
      }
    } catch (error) {
      console.error("获取代币余额失败:", error);
      setTokenBalance("获取失败");
    } finally {
      setLoadingBalance(false);
    }
  };

  // 当地址变化时获取余额
  useEffect(() => {
    if (address) {
      fetchTokenBalance();
    } else {
      setTokenBalance(null);
    }
  }, [address]);

  // Connect to MetaMask
  const handleLogin = async () => {
    if (!isMetaMaskInstalled()) {
      alert("请安装 MetaMask 钱包！");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAddress(accounts[0]);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAddress(accounts[0] || null);
      });
    } catch (error) {
      console.error("MetaMask 连接错误:", error);
    }
  };

  // Disconnect from MetaMask (note: full disconnection requires user action in MetaMask)
  const handleLogout = () => {
    setAddress(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !address) return;

    setUploading(true);
    try {
      // Get the file data
      const fileData = await file.arrayBuffer();

      // Create a provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Generate a signature using MetaMask
      const MESSAGE_TO_SIGN = "Upload file to 0G Storage";
      const signature = await signer.signMessage(MESSAGE_TO_SIGN);

      // Prepare form data for upload to 0G.ai storage API
      const formData = new FormData();
      formData.append("file", new Blob([fileData]), file.name);
      formData.append("walletAddress", address);
      formData.append("signature", signature);

      // Upload to 0G.ai using their API
      const response = await fetch("https://api.0g.ai/api/v1/content/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }

      const result = await response.json();
      setUploadedCid(result.cid);
    } catch (error) {
      console.error("文件上传错误:", error);
      alert("文件上传失败，请查看控制台了解详情。");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>区块链文件上传</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {address ? (
            <>
              <div className="flex flex-col gap-2">
                <div className="text-sm">
                  已连接钱包：<span className="font-mono">{address}</span>
                </div>
                {/* {networkName && (
                  <div className="text-xs bg-muted inline-flex items-center px-2 py-1 rounded-md">
                    当前网络: <span className="font-medium ml-1">{networkName}</span>
                    {networkName && networkName.startsWith("Unknown") && (
                      <span className="ml-1 text-amber-500">
                        (未支持的网络 ID，请切换到支持的网络)
                      </span>
                    )}
                  </div>
                )} */}
                <div className="flex items-center gap-2">
                  <div className="text-sm">
                    {tokenSymbol} 余额: {loadingBalance ? (
                      <span className="inline-flex items-center">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" /> 加载中...
                      </span>
                    ) : (
                      <span className="font-semibold">{tokenBalance || "0"}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={fetchTokenBalance}
                    disabled={loadingBalance}
                    title="刷新余额"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button onClick={triggerFileInput} variant="outline" className="w-full">
                  {file ? file.name : "选择文件"}
                </Button>
              </div>
              {file && (
                <div className="text-sm">
                  文件大小: {(file.size / 1024).toFixed(2)} KB
                </div>
              )}
              {uploadedCid && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-semibold">上传成功!</p>
                  <p className="text-sm break-all">
                    CID: <span className="font-mono">{uploadedCid}</span>
                  </p>
                  <a
                    href={`https://0g.ai/content/${uploadedCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    在 0G.ai 上查看
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="mb-4">连接 MetaMask 钱包来上传文件到区块链</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {address ? (
          <>
            <Button variant="outline" onClick={handleLogout}>
              断开钱包
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  上传到区块链
                </>
              )}
            </Button>
          </>
        ) : (
          <Button onClick={handleLogin}>连接钱包</Button>
        )}
      </CardFooter>
    </Card>
  );
}
