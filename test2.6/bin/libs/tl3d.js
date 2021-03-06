(function (exports) {
	'use strict';

	/**
	 * @internal
	 * <code>BufferState</code> 类用于实现渲染所需的Buffer状态集合。
	 */
	class BufferState extends Laya.BufferStateBase {
	    /**
	     * 创建一个 <code>BufferState</code> 实例。
	     */
	    constructor() {
	        super();
	    }
	    /**
	     * vertexBuffer的vertexDeclaration不能为空,该函数比较消耗性能，建议初始化时使用。
	     */
	    applyVertexBuffer(vertexBuffer) {
	        if (Laya.BufferStateBase._curBindedBufferState === this) {
	            var gl = Laya.LayaGL.instance;
	            var verDec = vertexBuffer.vertexDeclaration;
	            var valueData = verDec._shaderValues.getData();
	            this.vertexDeclaration = verDec;
	            vertexBuffer.bind();
	            for (var k in valueData) {
	                var loc = parseInt(k);
	                var attribute = valueData[k];
	                gl.enableVertexAttribArray(loc);
	                gl.vertexAttribPointer(loc, attribute[0], attribute[1], !!attribute[2], attribute[3], attribute[4]);
	            }
	        }
	        else {
	            throw "BufferState: must call bind() function first.";
	        }
	    }
	    /**
	     * vertexBuffers中的vertexDeclaration不能为空,该函数比较消耗性能，建议初始化时使用。
	     */
	    applyVertexBuffers(vertexBuffers) {
	        if (Laya.BufferStateBase._curBindedBufferState === this) {
	            var gl = Laya.LayaGL.instance;
	            for (var i = 0, n = vertexBuffers.length; i < n; i++) {
	                var verBuf = vertexBuffers[i];
	                var verDec = verBuf.vertexDeclaration;
	                // var valueData: any = verDec._shaderValues.getData();
	                verBuf.bind();
	                /*			for (var k in valueData) {
	                                var loc: number = parseInt(k);
	                                var attribute: any[] = valueData[k];
	                                gl.enableVertexAttribArray(loc);
	                                gl.vertexAttribPointer(loc, attribute[0], attribute[1], !!attribute[2], attribute[3], attribute[4]);
	                            } */
	            }
	        }
	        else {
	            throw "BufferState: must call bind() function first.";
	        }
	    }
	    applyIndexBuffer(indexBuffer) {
	        if (Laya.BufferStateBase._curBindedBufferState === this) {
	            if (this._bindedIndexBuffer !== indexBuffer) {
	                indexBuffer._bindForVAO(); //TODO:可和vao合并bind
	                this._bindedIndexBuffer = indexBuffer;
	            }
	        }
	        else {
	            throw "BufferState: must call bind() function first.";
	        }
	    }
	}

	(function (IndexFormat) {
	    /** 8 位无符号整型索引格式。*/
	    IndexFormat[IndexFormat["UInt8"] = 0] = "UInt8";
	    /** 16 位无符号整型索引格式。*/
	    IndexFormat[IndexFormat["UInt16"] = 1] = "UInt16";
	    /** 32 位无符号整型索引格式。*/
	    IndexFormat[IndexFormat["UInt32"] = 2] = "UInt32";
	})(exports.IndexFormat || (exports.IndexFormat = {}));

	/**
	 * <code>IndexBuffer3D</code> 类用于创建索引缓冲。
	 */
	class IndexBuffer3D extends Laya.Buffer {
	    /**
	     * 创建一个 <code>IndexBuffer3D,不建议开发者使用并用IndexBuffer3D.create()代替</code> 实例。
	     * @param	indexType 索引类型。
	     * @param	indexCount 索引个数。
	     * @param	bufferUsage IndexBuffer3D用途类型。
	     * @param	canRead 是否可读。
	     */
	    constructor(indexType, indexCount, bufferUsage = 0x88E4 /*WebGLContext.STATIC_DRAW*/, canRead = false) {
	        super();
	        this._indexType = indexType;
	        let gl = Laya.LayaGL.instance;
	        this._indexCount = indexCount;
	        this._bufferUsage = bufferUsage;
	        this._bufferType = gl.ELEMENT_ARRAY_BUFFER;
	        this._canRead = canRead;
	        switch (indexType) {
	            case exports.IndexFormat.UInt32:
	                this._indexTypeByteCount = 4;
	                break;
	            case exports.IndexFormat.UInt16:
	                this._indexTypeByteCount = 2;
	                break;
	            case exports.IndexFormat.UInt8:
	                this._indexTypeByteCount = 1;
	                break;
	            default:
	                throw new Error("unidentification index type.");
	        }
	        var byteLength = this._indexTypeByteCount * indexCount;
	        var curBufSta = Laya.BufferStateBase._curBindedBufferState;
	        this._byteLength = byteLength;
	        if (curBufSta) {
	            if (curBufSta["_bindedIndexBuffer"] === this) {
	                gl.bufferData(this._bufferType, byteLength, this._bufferUsage);
	            }
	            else {
	                curBufSta.unBind(); //避免影响VAO
	                this.bind();
	                gl.bufferData(this._bufferType, byteLength, this._bufferUsage);
	                curBufSta.bind();
	            }
	        }
	        else {
	            this.bind();
	            gl.bufferData(this._bufferType, byteLength, this._bufferUsage);
	        }
	        if (canRead) {
	            switch (indexType) {
	                case exports.IndexFormat.UInt32:
	                    this._buffer = new Uint32Array(indexCount);
	                    break;
	                case exports.IndexFormat.UInt16:
	                    this._buffer = new Uint16Array(indexCount);
	                    break;
	                case exports.IndexFormat.UInt8:
	                    this._buffer = new Uint8Array(indexCount);
	                    break;
	            }
	        }
	    }
	    /**
	     * 索引类型。
	     */
	    get indexType() {
	        return this._indexType;
	    }
	    /**
	     * 索引类型字节数量。
	     */
	    get indexTypeByteCount() {
	        return this._indexTypeByteCount;
	    }
	    /**
	     * 索引个数。
	     */
	    get indexCount() {
	        return this._indexCount;
	    }
	    /**
	     * 是否可读。
	     */
	    get canRead() {
	        return this._canRead;
	    }
	    /**
	     * @inheritDoc
	     * @override
	     */
	    _bindForVAO() {
	        if (Laya.BufferStateBase._curBindedBufferState) {
	            let gl = Laya.LayaGL.instance;
	            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._glBuffer);
	        }
	        else {
	            throw "IndexBuffer3D: must bind current BufferState.";
	        }
	    }
	    /**
	     * @inheritDoc
	     * @override
	     */
	    bind() {
	        if (Laya.BufferStateBase._curBindedBufferState) {
	            throw "IndexBuffer3D: must unbind current BufferState.";
	        }
	        else {
	            if (Laya.Buffer._bindedIndexBuffer !== this._glBuffer) {
	                let gl = Laya.LayaGL.instance;
	                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._glBuffer);
	                Laya.Buffer._bindedIndexBuffer = this._glBuffer;
	                return true;
	            }
	            else {
	                return false;
	            }
	        }
	    }
	    /**
	     * 设置数据。
	     * @param	data 索引数据。
	     * @param	bufferOffset 索引缓冲中的偏移。
	     * @param	dataStartIndex 索引数据的偏移。
	     * @param	dataCount 索引数据的数量。
	     */
	    setData(data, bufferOffset = 0, dataStartIndex = 0, dataCount = 4294967295 /*uint.MAX_VALUE*/) {
	        var byteCount = this._indexTypeByteCount;
	        if (dataStartIndex !== 0 || dataCount !== 4294967295 /*uint.MAX_VALUE*/) {
	            switch (this._indexType) {
	                case exports.IndexFormat.UInt32:
	                    data = new Uint32Array(data.buffer, dataStartIndex * byteCount, dataCount);
	                    break;
	                case exports.IndexFormat.UInt16:
	                    data = new Uint16Array(data.buffer, dataStartIndex * byteCount, dataCount);
	                    break;
	                case exports.IndexFormat.UInt8:
	                    data = new Uint8Array(data.buffer, dataStartIndex * byteCount, dataCount);
	                    break;
	            }
	        }
	        let gl = Laya.LayaGL.instance;
	        var curBufSta = Laya.BufferStateBase._curBindedBufferState;
	        if (curBufSta) {
	            if (curBufSta._bindedIndexBuffer === this) {
	                gl.bufferSubData(this._bufferType, bufferOffset * byteCount, data); //offset==0情况下，某些特殊设备或情况下直接bufferData速度是否优于bufferSubData
	            }
	            else {
	                curBufSta.unBind(); //避免影响VAO
	                this.bind();
	                gl.bufferSubData(this._bufferType, bufferOffset * byteCount, data);
	                curBufSta.bind();
	            }
	        }
	        else {
	            this.bind();
	            gl.bufferSubData(this._bufferType, bufferOffset * byteCount, data);
	        }
	        if (this._canRead) {
	            if (bufferOffset !== 0 || dataStartIndex !== 0 || dataCount !== 4294967295 /*uint.MAX_VALUE*/) {
	                var maxLength = this._buffer.length - bufferOffset;
	                if (dataCount > maxLength)
	                    dataCount = maxLength;
	                for (var i = 0; i < dataCount; i++)
	                    this._buffer[bufferOffset + i] = data[i];
	            }
	            else {
	                this._buffer = data;
	            }
	        }
	    }
	    /**
	     * 获取索引数据。
	     * @return	索引数据。
	     */
	    getData() {
	        if (this._canRead)
	            return this._buffer;
	        else
	            throw new Error("Can't read data from VertexBuffer with only write flag!");
	    }
	    /**
	     * @inheritDoc
	     * @override
	     */
	    destroy() {
	        super.destroy();
	        this._buffer = null;
	    }
	}

	/**
	 * <code>MathUtils3D</code> 类用于创建数学工具。
	 */
	class MathUtils3D {
	    /**
	     * 创建一个 <code>MathUtils</code> 实例。
	     */
	    constructor() {
	    }
	    /**
	     * 是否在容差的范围内近似于0
	     * @param  判断值
	     * @return  是否近似于0
	     */
	    static isZero(v) {
	        return Math.abs(v) < MathUtils3D.zeroTolerance;
	    }
	    /**
	     * 两个值是否在容差的范围内近似相等Sqr Magnitude
	     * @param  判断值
	     * @return  是否近似于0
	     */
	    static nearEqual(n1, n2) {
	        if (MathUtils3D.isZero(n1 - n2))
	            return true;
	        return false;
	    }
	    static fastInvSqrt(value) {
	        if (MathUtils3D.isZero(value))
	            return value;
	        return 1.0 / Math.sqrt(value);
	    }
	}
	/**单精度浮点(float)零的容差*/
	MathUtils3D.zeroTolerance = 1e-6;
	/**浮点数默认最大值*/
	MathUtils3D.MaxValue = 3.40282347e+38;
	/**浮点数默认最小值*/
	MathUtils3D.MinValue = -3.40282347e+38;
	/**角度转弧度系数*/
	MathUtils3D.Deg2Rad = Math.PI / 180;

	/**
	 * <code>Vector2</code> 类用于创建二维向量。
	 */
	class Vector2 {
	    /**
	     * 创建一个 <code>Vector2</code> 实例。
	     * @param	x  X轴坐标。
	     * @param	y  Y轴坐标。
	     */
	    constructor(x = 0, y = 0) {
	        this.x = x;
	        this.y = y;
	    }
	    /**
	     * 设置xy值。
	     * @param	x X值。
	     * @param	y Y值。
	     */
	    setValue(x, y) {
	        this.x = x;
	        this.y = y;
	    }
	    /**
	     * 缩放二维向量。
	     * @param	a 源二维向量。
	     * @param	b 缩放值。
	     * @param	out 输出二维向量。
	     */
	    static scale(a, b, out) {
	        out.x = a.x * b;
	        out.y = a.y * b;
	    }
	    /**
	     * 从Array数组拷贝值。
	     * @param  array 数组。
	     * @param  offset 数组偏移。
	     */
	    fromArray(array, offset = 0) {
	        this.x = array[offset + 0];
	        this.y = array[offset + 1];
	    }
	    /**
	     * 克隆。
	     * @param	destObject 克隆源。
	     */
	    cloneTo(destObject) {
	        var destVector2 = destObject;
	        destVector2.x = this.x;
	        destVector2.y = this.y;
	    }
	    /**
	     * 求两个二维向量的点积。
	     * @param	a left向量。
	     * @param	b right向量。
	     * @return   点积。
	     */
	    static dot(a, b) {
	        return (a.x * b.x) + (a.y * b.y);
	    }
	    /**
	     * 归一化二维向量。
	     * @param	s 源三维向量。
	     * @param	out 输出三维向量。
	     */
	    static normalize(s, out) {
	        var x = s.x, y = s.y;
	        var len = x * x + y * y;
	        if (len > 0) {
	            len = 1 / Math.sqrt(len);
	            out.x = x * len;
	            out.y = y * len;
	        }
	    }
	    /**
	     * 计算标量长度。
	     * @param	a 源三维向量。
	     * @return 标量长度。
	     */
	    static scalarLength(a) {
	        var x = a.x, y = a.y;
	        return Math.sqrt(x * x + y * y);
	    }
	    /**
	     * 克隆。
	     * @return	 克隆副本。
	     */
	    clone() {
	        var destVector2 = new Vector2();
	        this.cloneTo(destVector2);
	        return destVector2;
	    }
	    forNativeElement(nativeElements = null) {
	        if (nativeElements) {
	            this.elements = nativeElements;
	            this.elements[0] = this.x;
	            this.elements[1] = this.y;
	        }
	        else {
	            this.elements = new Float32Array([this.x, this.y]);
	        }
	        Vector2.rewriteNumProperty(this, "x", 0);
	        Vector2.rewriteNumProperty(this, "y", 1);
	    }
	    static rewriteNumProperty(proto, name, index) {
	        Object["defineProperty"](proto, name, {
	            "get": function () {
	                return this.elements[index];
	            },
	            "set": function (v) {
	                this.elements[index] = v;
	            }
	        });
	    }
	}
	/**零向量,禁止修改*/
	Vector2.ZERO = new Vector2(0.0, 0.0);
	/**一向量,禁止修改*/
	Vector2.ONE = new Vector2(1.0, 1.0);

	/**
	 * <code>Vector4</code> 类用于创建四维向量。
	 */
	class Vector4 {
	    /**
	     * 创建一个 <code>Vector4</code> 实例。
	     * @param	x  X轴坐标。
	     * @param	y  Y轴坐标。
	     * @param	z  Z轴坐标。
	     * @param	w  W轴坐标。
	     */
	    constructor(x = 0, y = 0, z = 0, w = 0) {
	        this.x = x;
	        this.y = y;
	        this.z = z;
	        this.w = w;
	    }
	    /**
	     * 设置xyzw值。
	     * @param	x X值。
	     * @param	y Y值。
	     * @param	z Z值。
	     * @param	w W值。
	     */
	    setValue(x, y, z, w) {
	        this.x = x;
	        this.y = y;
	        this.z = z;
	        this.w = w;
	    }
	    /**
	     * 从Array数组拷贝值。
	     * @param  array 数组。
	     * @param  offset 数组偏移。
	     */
	    fromArray(array, offset = 0) {
	        this.x = array[offset + 0];
	        this.y = array[offset + 1];
	        this.z = array[offset + 2];
	        this.w = array[offset + 3];
	    }
	    /**
	     * 克隆。
	     * @param	destObject 克隆源。
	     */
	    cloneTo(destObject) {
	        var destVector4 = destObject;
	        destVector4.x = this.x;
	        destVector4.y = this.y;
	        destVector4.z = this.z;
	        destVector4.w = this.w;
	    }
	    /**
	     * 克隆。
	     * @return	 克隆副本。
	     */
	    clone() {
	        var destVector4 = new Vector4();
	        this.cloneTo(destVector4);
	        return destVector4;
	    }
	    /**
	     * 插值四维向量。
	     * @param	a left向量。
	     * @param	b right向量。
	     * @param	t 插值比例。
	     * @param	out 输出向量。
	     */
	    static lerp(a, b, t, out) {
	        var ax = a.x, ay = a.y, az = a.z, aw = a.w;
	        out.x = ax + t * (b.x - ax);
	        out.y = ay + t * (b.y - ay);
	        out.z = az + t * (b.z - az);
	        out.w = aw + t * (b.w - aw);
	    }
	    /**
	     * 通过4x4矩阵把一个四维向量转换为另一个四维向量
	     * @param	vector4 带转换四维向量。
	     * @param	M4x4    4x4矩阵。
	     * @param	out     转换后四维向量。
	     */
	    static transformByM4x4(vector4, m4x4, out) {
	        var vx = vector4.x;
	        var vy = vector4.y;
	        var vz = vector4.z;
	        var vw = vector4.w;
	        var me = m4x4.elements;
	        out.x = vx * me[0] + vy * me[4] + vz * me[8] + vw * me[12];
	        out.y = vx * me[1] + vy * me[5] + vz * me[9] + vw * me[13];
	        out.z = vx * me[2] + vy * me[6] + vz * me[10] + vw * me[14];
	        out.w = vx * me[3] + vy * me[7] + vz * me[11] + vw * me[15];
	    }
	    /**
	     * 判断两个四维向量是否相等。
	     * @param	a 四维向量。
	     * @param	b 四维向量。
	     * @return  是否相等。
	     */
	    static equals(a, b) {
	        return MathUtils3D.nearEqual(Math.abs(a.x), Math.abs(b.x)) && MathUtils3D.nearEqual(Math.abs(a.y), Math.abs(b.y)) && MathUtils3D.nearEqual(Math.abs(a.z), Math.abs(b.z)) && MathUtils3D.nearEqual(Math.abs(a.w), Math.abs(b.w));
	    }
	    /**
	     * 求四维向量的长度。
	     * @return  长度。
	     */
	    length() {
	        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
	    }
	    /**
	     * 求四维向量长度的平方。
	     * @return  长度的平方。
	     */
	    lengthSquared() {
	        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
	    }
	    /**
	     * 归一化四维向量。
	     * @param	s   源四维向量。
	     * @param	out 输出四维向量。
	     */
	    static normalize(s, out) {
	        var len = s.length();
	        if (len > 0) {
	            var inverse = 1.0 / len;
	            out.x = s.x * inverse;
	            out.y = s.y * inverse;
	            out.z = s.z * inverse;
	            out.w = s.w * inverse;
	        }
	    }
	    /**
	     * 求两个四维向量的和。
	     * @param	a   四维向量。
	     * @param	b   四维向量。
	     * @param	out 输出向量。
	     */
	    static add(a, b, out) {
	        out.x = a.x + b.x;
	        out.y = a.y + b.y;
	        out.z = a.z + b.z;
	        out.w = a.w + b.w;
	    }
	    /**
	     * 求两个四维向量的差。
	     * @param	a   四维向量。
	     * @param	b   四维向量。
	     * @param	out 输出向量。
	     */
	    static subtract(a, b, out) {
	        out.x = a.x - b.x;
	        out.y = a.y - b.y;
	        out.z = a.z - b.z;
	        out.w = a.w - b.w;
	    }
	    /**
	     * 计算两个四维向量的乘积。
	     * @param	a   四维向量。
	     * @param	b   四维向量。
	     * @param	out 输出向量。
	     */
	    static multiply(a, b, out) {
	        out.x = a.x * b.x;
	        out.y = a.y * b.y;
	        out.z = a.z * b.z;
	        out.w = a.w * b.w;
	    }
	    /**
	     * 缩放四维向量。
	     * @param	a   源四维向量。
	     * @param	b   缩放值。
	     * @param	out 输出四维向量。
	     */
	    static scale(a, b, out) {
	        out.x = a.x * b;
	        out.y = a.y * b;
	        out.z = a.z * b;
	        out.w = a.w * b;
	    }
	    /**
	     * 求一个指定范围的四维向量
	     * @param	value clamp向量
	     * @param	min   最小
	     * @param	max   最大
	     * @param   out   输出向量
	     */
	    static Clamp(value, min, max, out) {
	        var x = value.x;
	        var y = value.y;
	        var z = value.z;
	        var w = value.w;
	        var mineX = min.x;
	        var mineY = min.y;
	        var mineZ = min.z;
	        var mineW = min.w;
	        var maxeX = max.x;
	        var maxeY = max.y;
	        var maxeZ = max.z;
	        var maxeW = max.w;
	        x = (x > maxeX) ? maxeX : x;
	        x = (x < mineX) ? mineX : x;
	        y = (y > maxeY) ? maxeY : y;
	        y = (y < mineY) ? mineY : y;
	        z = (z > maxeZ) ? maxeZ : z;
	        z = (z < mineZ) ? mineZ : z;
	        w = (w > maxeW) ? maxeW : w;
	        w = (w < mineW) ? mineW : w;
	        out.x = x;
	        out.y = y;
	        out.z = z;
	        out.w = w;
	    }
	    /**
	     * 两个四维向量距离的平方。
	     * @param	value1 向量1。
	     * @param	value2 向量2。
	     * @return	距离的平方。
	     */
	    static distanceSquared(value1, value2) {
	        var x = value1.x - value2.x;
	        var y = value1.y - value2.y;
	        var z = value1.z - value2.z;
	        var w = value1.w - value2.w;
	        return (x * x) + (y * y) + (z * z) + (w * w);
	    }
	    /**
	     * 两个四维向量距离。
	     * @param	value1 向量1。
	     * @param	value2 向量2。
	     * @return	距离。
	     */
	    static distance(value1, value2) {
	        var x = value1.x - value2.x;
	        var y = value1.y - value2.y;
	        var z = value1.z - value2.z;
	        var w = value1.w - value2.w;
	        return Math.sqrt((x * x) + (y * y) + (z * z) + (w * w));
	    }
	    /**
	     * 求两个四维向量的点积。
	     * @param	a 向量。
	     * @param	b 向量。
	     * @return  点积。
	     */
	    static dot(a, b) {
	        return (a.x * b.x) + (a.y * b.y) + (a.z * b.z) + (a.w * b.w);
	    }
	    /**
	     * 分别取两个四维向量x、y、z的最小值计算新的四维向量。
	     * @param	a   四维向量。
	     * @param	b   四维向量。
	     * @param	out 结果三维向量。
	     */
	    static min(a, b, out) {
	        out.x = Math.min(a.x, b.x);
	        out.y = Math.min(a.y, b.y);
	        out.z = Math.min(a.z, b.z);
	        out.w = Math.min(a.w, b.w);
	    }
	    /**
	     * 分别取两个四维向量x、y、z的最大值计算新的四维向量。
	     * @param	a   四维向量。
	     * @param	b   四维向量。
	     * @param	out 结果三维向量。
	     */
	    static max(a, b, out) {
	        out.x = Math.max(a.x, b.x);
	        out.y = Math.max(a.y, b.y);
	        out.z = Math.max(a.z, b.z);
	        out.w = Math.max(a.w, b.w);
	    }
	    forNativeElement(nativeElements = null) {
	        if (nativeElements) {
	            this.elements = nativeElements;
	            this.elements[0] = this.x;
	            this.elements[1] = this.y;
	            this.elements[2] = this.z;
	            this.elements[3] = this.w;
	        }
	        else {
	            this.elements = new Float32Array([this.x, this.y, this.z, this.w]);
	        }
	        Vector2.rewriteNumProperty(this, "x", 0);
	        Vector2.rewriteNumProperty(this, "y", 1);
	        Vector2.rewriteNumProperty(this, "z", 2);
	        Vector2.rewriteNumProperty(this, "w", 3);
	    }
	}
	/**零向量，禁止修改*/
	Vector4.ZERO = new Vector4();
	/*一向量，禁止修改*/
	Vector4.ONE = new Vector4(1.0, 1.0, 1.0, 1.0);
	/*X单位向量，禁止修改*/
	Vector4.UnitX = new Vector4(1.0, 0.0, 0.0, 0.0);
	/*Y单位向量，禁止修改*/
	Vector4.UnitY = new Vector4(0.0, 1.0, 0.0, 0.0);
	/*Z单位向量，禁止修改*/
	Vector4.UnitZ = new Vector4(0.0, 0.0, 1.0, 0.0);
	/*W单位向量，禁止修改*/
	Vector4.UnitW = new Vector4(0.0, 0.0, 0.0, 1.0);

	/**
	 * <code>Vector3</code> 类用于创建三维向量。
	 */
	class Vector3 {
	    /**
	     * 创建一个 <code>Vector3</code> 实例。
	     * @param	x  X轴坐标。
	     * @param	y  Y轴坐标。
	     * @param	z  Z轴坐标。
	     */
	    constructor(x = 0, y = 0, z = 0, nativeElements = null /*[NATIVE]*/) {
	        this.x = x;
	        this.y = y;
	        this.z = z;
	    }
	    /**
	     * 两个三维向量距离的平方。
	     * @param	value1 向量1。
	     * @param	value2 向量2。
	     * @return	距离的平方。
	     */
	    static distanceSquared(value1, value2) {
	        var x = value1.x - value2.x;
	        var y = value1.y - value2.y;
	        var z = value1.z - value2.z;
	        return (x * x) + (y * y) + (z * z);
	    }
	    /**
	     * 两个三维向量距离。
	     * @param	value1 向量1。
	     * @param	value2 向量2。
	     * @return	距离。
	     */
	    static distance(value1, value2) {
	        var x = value1.x - value2.x;
	        var y = value1.y - value2.y;
	        var z = value1.z - value2.z;
	        return Math.sqrt((x * x) + (y * y) + (z * z));
	    }
	    /**
	     * 分别取两个三维向量x、y、z的最小值计算新的三维向量。
	     * @param	a。
	     * @param	b。
	     * @param	out。
	     */
	    static min(a, b, out) {
	        out.x = Math.min(a.x, b.x);
	        out.y = Math.min(a.y, b.y);
	        out.z = Math.min(a.z, b.z);
	    }
	    /**
	     * 分别取两个三维向量x、y、z的最大值计算新的三维向量。
	     * @param	a a三维向量。
	     * @param	b b三维向量。
	     * @param	out 结果三维向量。
	     */
	    static max(a, b, out) {
	        out.x = Math.max(a.x, b.x);
	        out.y = Math.max(a.y, b.y);
	        out.z = Math.max(a.z, b.z);
	    }
	    /**
	     * 根据四元数旋转三维向量。
	     * @param	source 源三维向量。
	     * @param	rotation 旋转四元数。
	     * @param	out 输出三维向量。
	     */
	    static transformQuat(source, rotation, out) {
	        var x = source.x, y = source.y, z = source.z, qx = rotation.x, qy = rotation.y, qz = rotation.z, qw = rotation.w, ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z;
	        out.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
	        out.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
	        out.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	    }
	    /**
	     * 计算标量长度。
	     * @param	a 源三维向量。
	     * @return 标量长度。
	     */
	    static scalarLength(a) {
	        var x = a.x, y = a.y, z = a.z;
	        return Math.sqrt(x * x + y * y + z * z);
	    }
	    /**
	     * 计算标量长度的平方。
	     * @param	a 源三维向量。
	     * @return 标量长度的平方。
	     */
	    static scalarLengthSquared(a) {
	        var x = a.x, y = a.y, z = a.z;
	        return x * x + y * y + z * z;
	    }
	    /**
	     * 归一化三维向量。
	     * @param	s 源三维向量。
	     * @param	out 输出三维向量。
	     */
	    static normalize(s, out) {
	        var x = s.x, y = s.y, z = s.z;
	        var len = x * x + y * y + z * z;
	        if (len > 0) {
	            len = 1 / Math.sqrt(len);
	            out.x = x * len;
	            out.y = y * len;
	            out.z = z * len;
	        }
	    }
	    /**
	     * 计算两个三维向量的乘积。
	     * @param	a left三维向量。
	     * @param	b right三维向量。
	     * @param	out 输出三维向量。
	     */
	    static multiply(a, b, out) {
	        out.x = a.x * b.x;
	        out.y = a.y * b.y;
	        out.z = a.z * b.z;
	    }
	    /**
	     * 缩放三维向量。
	     * @param	a 源三维向量。
	     * @param	b 缩放值。
	     * @param	out 输出三维向量。
	     */
	    static scale(a, b, out) {
	        out.x = a.x * b;
	        out.y = a.y * b;
	        out.z = a.z * b;
	    }
	    /**
	     * 插值三维向量。
	     * @param	a left向量。
	     * @param	b right向量。
	     * @param	t 插值比例。
	     * @param	out 输出向量。
	     */
	    static lerp(a, b, t, out) {
	        var ax = a.x, ay = a.y, az = a.z;
	        out.x = ax + t * (b.x - ax);
	        out.y = ay + t * (b.y - ay);
	        out.z = az + t * (b.z - az);
	    }
	    /**
	     * 通过矩阵转换一个三维向量到另外一个三维向量。
	     * @param	vector 源三维向量。
	     * @param	transform  变换矩阵。
	     * @param	result 输出三维向量。
	     */
	    static transformV3ToV3(vector, transform, result) {
	        var intermediate = Vector3._tempVector4;
	        Vector3.transformV3ToV4(vector, transform, intermediate);
	        result.x = intermediate.x;
	        result.y = intermediate.y;
	        result.z = intermediate.z;
	    }
	    /**
	     * 通过矩阵转换一个三维向量到另外一个四维向量。
	     * @param	vector 源三维向量。
	     * @param	transform  变换矩阵。
	     * @param	result 输出四维向量。
	     */
	    static transformV3ToV4(vector, transform, result) {
	        var vectorX = vector.x;
	        var vectorY = vector.y;
	        var vectorZ = vector.z;
	        var transformElem = transform.elements;
	        result.x = (vectorX * transformElem[0]) + (vectorY * transformElem[4]) + (vectorZ * transformElem[8]) + transformElem[12];
	        result.y = (vectorX * transformElem[1]) + (vectorY * transformElem[5]) + (vectorZ * transformElem[9]) + transformElem[13];
	        result.z = (vectorX * transformElem[2]) + (vectorY * transformElem[6]) + (vectorZ * transformElem[10]) + transformElem[14];
	        result.w = (vectorX * transformElem[3]) + (vectorY * transformElem[7]) + (vectorZ * transformElem[11]) + transformElem[15];
	    }
	    /**
	     * 通过法线矩阵转换一个法线三维向量到另外一个三维向量。
	     * @param	normal 源法线三维向量。
	     * @param	transform  法线变换矩阵。
	     * @param	result 输出法线三维向量。
	     */
	    static TransformNormal(normal, transform, result) {
	        var normalX = normal.x;
	        var normalY = normal.y;
	        var normalZ = normal.z;
	        var transformElem = transform.elements;
	        result.x = (normalX * transformElem[0]) + (normalY * transformElem[4]) + (normalZ * transformElem[8]);
	        result.y = (normalX * transformElem[1]) + (normalY * transformElem[5]) + (normalZ * transformElem[9]);
	        result.z = (normalX * transformElem[2]) + (normalY * transformElem[6]) + (normalZ * transformElem[10]);
	    }
	    /**
	     * 通过矩阵转换一个三维向量到另外一个归一化的三维向量。
	     * @param	vector 源三维向量。
	     * @param	transform  变换矩阵。
	     * @param	result 输出三维向量。
	     */
	    static transformCoordinate(coordinate, transform, result) {
	        var coordinateX = coordinate.x;
	        var coordinateY = coordinate.y;
	        var coordinateZ = coordinate.z;
	        var transformElem = transform.elements;
	        var w = coordinateX * transformElem[3] + coordinateY * transformElem[7] + coordinateZ * transformElem[11] + transformElem[15];
	        result.x = (coordinateX * transformElem[0] + coordinateY * transformElem[4] + coordinateZ * transformElem[8] + transformElem[12]) / w;
	        result.y = (coordinateX * transformElem[1] + coordinateY * transformElem[5] + coordinateZ * transformElem[9] + transformElem[13]) / w;
	        result.z = (coordinateX * transformElem[2] + coordinateY * transformElem[6] + coordinateZ * transformElem[10] + transformElem[14]) / w;
	    }
	    /**
	     * 求一个指定范围的向量
	     * @param	value clamp向量
	     * @param	min  最小
	     * @param	max  最大
	     * @param   out 输出向量
	     */
	    static Clamp(value, min, max, out) {
	        var x = value.x;
	        var y = value.y;
	        var z = value.z;
	        var mineX = min.x;
	        var mineY = min.y;
	        var mineZ = min.z;
	        var maxeX = max.x;
	        var maxeY = max.y;
	        var maxeZ = max.z;
	        x = (x > maxeX) ? maxeX : x;
	        x = (x < mineX) ? mineX : x;
	        y = (y > maxeY) ? maxeY : y;
	        y = (y < mineY) ? mineY : y;
	        z = (z > maxeZ) ? maxeZ : z;
	        z = (z < mineZ) ? mineZ : z;
	        out.x = x;
	        out.y = y;
	        out.z = z;
	    }
	    /**
	     * 求两个三维向量的和。
	     * @param	a left三维向量。
	     * @param	b right三维向量。
	     * @param	out 输出向量。
	     */
	    static add(a, b, out) {
	        out.x = a.x + b.x;
	        out.y = a.y + b.y;
	        out.z = a.z + b.z;
	    }
	    /**
	     * 求两个三维向量的差。
	     * @param	a  left三维向量。
	     * @param	b  right三维向量。
	     * @param	o out 输出向量。
	     */
	    static subtract(a, b, o) {
	        o.x = a.x - b.x;
	        o.y = a.y - b.y;
	        o.z = a.z - b.z;
	    }
	    /**
	     * 求两个三维向量的叉乘。
	     * @param	a left向量。
	     * @param	b right向量。
	     * @param	o 输出向量。
	     */
	    static cross(a, b, o) {
	        var ax = a.x, ay = a.y, az = a.z, bx = b.x, by = b.y, bz = b.z;
	        o.x = ay * bz - az * by;
	        o.y = az * bx - ax * bz;
	        o.z = ax * by - ay * bx;
	    }
	    /**
	     * 求两个三维向量的点积。
	     * @param	a left向量。
	     * @param	b right向量。
	     * @return   点积。
	     */
	    static dot(a, b) {
	        return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
	    }
	    /**
	     * 判断两个三维向量是否相等。
	     * @param	a 三维向量。
	     * @param	b 三维向量。
	     * @return  是否相等。
	     */
	    static equals(a, b) {
	        return MathUtils3D.nearEqual(a.x, b.x) && MathUtils3D.nearEqual(a.y, b.y) && MathUtils3D.nearEqual(a.z, b.z);
	    }
	    /**
	     * 设置xyz值。
	     * @param	x X值。
	     * @param	y Y值。
	     * @param	z Z值。
	     */
	    setValue(x, y, z) {
	        this.x = x;
	        this.y = y;
	        this.z = z;
	    }
	    /**
	     * 从Array数组拷贝值。
	     * @param  array 数组。
	     * @param  offset 数组偏移。
	     */
	    fromArray(array, offset = 0) {
	        this.x = array[offset + 0];
	        this.y = array[offset + 1];
	        this.z = array[offset + 2];
	    }
	    /**
	     * 克隆。
	     * @param	destObject 克隆源。
	     */
	    cloneTo(destObject) {
	        var destVector3 = destObject;
	        destVector3.x = this.x;
	        destVector3.y = this.y;
	        destVector3.z = this.z;
	    }
	    /**
	     * 克隆。
	     * @return	 克隆副本。
	     */
	    clone() {
	        var destVector3 = new Vector3();
	        this.cloneTo(destVector3);
	        return destVector3;
	    }
	    toDefault() {
	        this.x = 0;
	        this.y = 0;
	        this.z = 0;
	    }
	    forNativeElement(nativeElements = null) {
	        if (nativeElements) {
	            this.elements = nativeElements;
	            this.elements[0] = this.x;
	            this.elements[1] = this.y;
	            this.elements[2] = this.z;
	        }
	        else {
	            this.elements = new Float32Array([this.x, this.y, this.z]);
	        }
	        Vector2.rewriteNumProperty(this, "x", 0);
	        Vector2.rewriteNumProperty(this, "y", 1);
	        Vector2.rewriteNumProperty(this, "z", 2);
	    }
	}
	/**@internal	*/
	Vector3._tempVector4 = new Vector4();
	/**@internal	*/
	Vector3._ZERO = new Vector3(0.0, 0.0, 0.0);
	/**@internal	*/
	Vector3._ONE = new Vector3(1.0, 1.0, 1.0);
	/**@internal	*/
	Vector3._NegativeUnitX = new Vector3(-1, 0, 0);
	/**@internal	*/
	Vector3._UnitX = new Vector3(1, 0, 0);
	/**@internal	*/
	Vector3._UnitY = new Vector3(0, 1, 0);
	/**@internal	*/
	Vector3._UnitZ = new Vector3(0, 0, 1);
	/**@internal	*/
	Vector3._ForwardRH = new Vector3(0, 0, -1);
	/**@internal	*/
	Vector3._ForwardLH = new Vector3(0, 0, 1);
	/**@internal	*/
	Vector3._Up = new Vector3(0, 1, 0);

	/**
	 * <code>Matrix3x3</code> 类用于创建3x3矩阵。
	 */
	class Matrix3x3 {
	    /**
	     * 创建一个 <code>Matrix3x3</code> 实例。
	     */
	    constructor() {
	        var e = this.elements = new Float32Array(9);
	        e[0] = 1;
	        e[1] = 0;
	        e[2] = 0;
	        e[3] = 0;
	        e[4] = 1;
	        e[5] = 0;
	        e[6] = 0;
	        e[7] = 0;
	        e[8] = 1;
	    }
	    /**
	     * 通过四元数创建旋转矩阵。
	     * @param rotation 旋转四元数。
	     * @param out 旋转矩阵。
	     */
	    static createRotationQuaternion(rotation, out) {
	        var rotX = rotation.x;
	        var rotY = rotation.y;
	        var rotZ = rotation.z;
	        var rotW = rotation.w;
	        var xx = rotX * rotX;
	        var yy = rotY * rotY;
	        var zz = rotZ * rotZ;
	        var xy = rotX * rotY;
	        var zw = rotZ * rotW;
	        var zx = rotZ * rotX;
	        var yw = rotY * rotW;
	        var yz = rotY * rotZ;
	        var xw = rotX * rotW;
	        var resultE = out.elements;
	        resultE[0] = 1.0 - (2.0 * (yy + zz));
	        resultE[1] = 2.0 * (xy + zw);
	        resultE[2] = 2.0 * (zx - yw);
	        resultE[3] = 2.0 * (xy - zw);
	        resultE[4] = 1.0 - (2.0 * (zz + xx));
	        resultE[5] = 2.0 * (yz + xw);
	        resultE[6] = 2.0 * (zx + yw);
	        resultE[7] = 2.0 * (yz - xw);
	        resultE[8] = 1.0 - (2.0 * (yy + xx));
	    }
	    /**
	     * 根据指定平移生成3x3矩阵
	     * @param	tra 平移
	     * @param	out 输出矩阵
	     */
	    static createFromTranslation(trans, out) {
	        var e = out.elements;
	        e[0] = 1;
	        e[1] = 0;
	        e[2] = 0;
	        e[3] = 0;
	        e[4] = 1;
	        e[5] = 0;
	        e[6] = trans.x;
	        e[7] = trans.y;
	        e[8] = 1;
	    }
	    /**
	     * 根据指定旋转生成3x3矩阵
	     * @param	rad  旋转值
	     * @param	out 输出矩阵
	     */
	    static createFromRotation(rad, out) {
	        var e = out.elements;
	        var s = Math.sin(rad), c = Math.cos(rad);
	        e[0] = c;
	        e[1] = s;
	        e[2] = 0;
	        e[3] = -s;
	        e[4] = c;
	        e[5] = 0;
	        e[6] = 0;
	        e[7] = 0;
	        e[8] = 1;
	    }
	    /**
	     * 根据制定缩放生成3x3矩阵
	     * @param	scale 缩放值
	     * @param	out 输出矩阵
	     */
	    static createFromScaling(scale, out) {
	        var e = out.elements;
	        e[0] = scale.x;
	        e[1] = 0;
	        e[2] = 0;
	        e[3] = 0;
	        e[4] = scale.y;
	        e[5] = 0;
	        e[6] = 0;
	        e[7] = 0;
	        e[8] = scale.z;
	    }
	    /**
	     * 从4x4矩阵转换为一个3x3的矩阵（原则为upper-left,忽略第四行四列）
	     * @param	sou 4x4源矩阵
	     * @param	out 3x3输出矩阵
	     */
	    static createFromMatrix4x4(sou, out) {
	        var souE = sou.elements;
	        var outE = out.elements;
	        outE[0] = souE[0];
	        outE[1] = souE[1];
	        outE[2] = souE[2];
	        outE[3] = souE[4];
	        outE[4] = souE[5];
	        outE[5] = souE[6];
	        outE[6] = souE[8];
	        outE[7] = souE[9];
	        outE[8] = souE[10];
	    }
	    /**
	     *  两个3x3矩阵的相乘
	     * @param	left 左矩阵
	     * @param	right  右矩阵
	     * @param	out  输出矩阵
	     */
	    static multiply(left, right, out) {
	        var l = left.elements;
	        var r = right.elements;
	        var e = out.elements;
	        var l11 = l[0], l12 = l[1], l13 = l[2];
	        var l21 = l[3], l22 = l[4], l23 = l[5];
	        var l31 = l[6], l32 = l[7], l33 = l[8];
	        var r11 = r[0], r12 = r[1], r13 = r[2];
	        var r21 = r[3], r22 = r[4], r23 = r[5];
	        var r31 = r[6], r32 = r[7], r33 = r[8];
	        e[0] = r11 * l11 + r12 * l21 + r13 * l31;
	        e[1] = r11 * l12 + r12 * l22 + r13 * r32;
	        e[2] = r11 * l13 + r12 * l23 + r13 * l33;
	        e[3] = r21 * l11 + r22 * l21 + r23 * l31;
	        e[4] = r21 * l12 + r22 * l22 + r23 * l32;
	        e[5] = r21 * l13 + r22 * l23 + r23 * l33;
	        e[6] = r31 * l11 + r32 * l21 + r33 * l31;
	        e[7] = r31 * l12 + r32 * l22 + r33 * l32;
	        e[8] = r31 * l13 + r32 * l23 + r33 * l33;
	    }
	    /**
	     * 计算3x3矩阵的行列式
	     * @return    矩阵的行列式
	     */
	    determinant() {
	        var f = this.elements;
	        var a00 = f[0], a01 = f[1], a02 = f[2];
	        var a10 = f[3], a11 = f[4], a12 = f[5];
	        var a20 = f[6], a21 = f[7], a22 = f[8];
	        return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
	    }
	    /**
	     * 通过一个二维向量转换3x3矩阵
	     * @param	tra 转换向量
	     * @param	out 输出矩阵
	     */
	    translate(trans, out) {
	        var e = out.elements;
	        var f = this.elements;
	        var a00 = f[0], a01 = f[1], a02 = f[2];
	        var a10 = f[3], a11 = f[4], a12 = f[5];
	        var a20 = f[6], a21 = f[7], a22 = f[8];
	        var x = trans.x, y = trans.y;
	        e[0] = a00;
	        e[1] = a01;
	        e[2] = a02;
	        e[3] = a10;
	        e[4] = a11;
	        e[5] = a12;
	        e[6] = x * a00 + y * a10 + a20;
	        e[7] = x * a01 + y * a11 + a21;
	        e[8] = x * a02 + y * a12 + a22;
	    }
	    /**
	     * 根据指定角度旋转3x3矩阵
	     * @param	rad 旋转角度
	     * @param	out 输出矩阵
	     */
	    rotate(rad, out) {
	        var e = out.elements;
	        var f = this.elements;
	        var a00 = f[0], a01 = f[1], a02 = f[2];
	        var a10 = f[3], a11 = f[4], a12 = f[5];
	        var a20 = f[6], a21 = f[7], a22 = f[8];
	        var s = Math.sin(rad);
	        var c = Math.cos(rad);
	        e[0] = c * a00 + s * a10;
	        e[1] = c * a01 + s * a11;
	        e[2] = c * a02 + s * a12;
	        e[3] = c * a10 - s * a00;
	        e[4] = c * a11 - s * a01;
	        e[5] = c * a12 - s * a02;
	        e[6] = a20;
	        e[7] = a21;
	        e[8] = a22;
	    }
	    /**
	     *根据制定缩放3x3矩阵
	     * @param	scale 缩放值
	     * @param	out 输出矩阵
	     */
	    scale(scale, out) {
	        var e = out.elements;
	        var f = this.elements;
	        var x = scale.x, y = scale.y;
	        e[0] = x * f[0];
	        e[1] = x * f[1];
	        e[2] = x * f[2];
	        e[3] = y * f[3];
	        e[4] = y * f[4];
	        e[5] = y * f[5];
	        e[6] = f[6];
	        e[7] = f[7];
	        e[8] = f[8];
	    }
	    /**
	     * 计算3x3矩阵的逆矩阵
	     * @param	out 输出的逆矩阵
	     */
	    invert(out) {
	        var e = out.elements;
	        var f = this.elements;
	        var a00 = f[0], a01 = f[1], a02 = f[2];
	        var a10 = f[3], a11 = f[4], a12 = f[5];
	        var a20 = f[6], a21 = f[7], a22 = f[8];
	        var b01 = a22 * a11 - a12 * a21;
	        var b11 = -a22 * a10 + a12 * a20;
	        var b21 = a21 * a10 - a11 * a20;
	        // Calculate the determinant
	        var det = a00 * b01 + a01 * b11 + a02 * b21;
	        if (!det) {
	            out = null;
	        }
	        det = 1.0 / det;
	        e[0] = b01 * det;
	        e[1] = (-a22 * a01 + a02 * a21) * det;
	        e[2] = (a12 * a01 - a02 * a11) * det;
	        e[3] = b11 * det;
	        e[4] = (a22 * a00 - a02 * a20) * det;
	        e[5] = (-a12 * a00 + a02 * a10) * det;
	        e[6] = b21 * det;
	        e[7] = (-a21 * a00 + a01 * a20) * det;
	        e[8] = (a11 * a00 - a01 * a10) * det;
	    }
	    /**
	     * 计算3x3矩阵的转置矩阵
	     * @param 	out 输出矩阵
	     */
	    transpose(out) {
	        var e = out.elements;
	        var f = this.elements;
	        if (out === this) {
	            var a01 = f[1], a02 = f[2], a12 = f[5];
	            e[1] = f[3];
	            e[2] = f[6];
	            e[3] = a01;
	            e[5] = f[7];
	            e[6] = a02;
	            e[7] = a12;
	        }
	        else {
	            e[0] = f[0];
	            e[1] = f[3];
	            e[2] = f[6];
	            e[3] = f[1];
	            e[4] = f[4];
	            e[5] = f[7];
	            e[6] = f[2];
	            e[7] = f[5];
	            e[8] = f[8];
	        }
	    }
	    /** 设置已有的矩阵为单位矩阵*/
	    identity() {
	        var e = this.elements;
	        e[0] = 1;
	        e[1] = 0;
	        e[2] = 0;
	        e[3] = 0;
	        e[4] = 1;
	        e[5] = 0;
	        e[6] = 0;
	        e[7] = 0;
	        e[8] = 1;
	    }
	    /**
	     * 克隆。
	     * @param	destObject 克隆源。
	     */
	    cloneTo(destObject) {
	        var i, s, d;
	        s = this.elements;
	        d = destObject.elements;
	        if (s === d) {
	            return;
	        }
	        for (i = 0; i < 9; ++i) {
	            d[i] = s[i];
	        }
	    }
	    /**
	     * 克隆。
	     * @return	 克隆副本。
	     */
	    clone() {
	        var dest = new Matrix3x3();
	        this.cloneTo(dest);
	        return dest;
	    }
	    /**
	     * 计算观察3x3矩阵
	     * @param	eye    观察者位置
	     * @param	target 目标位置
	     * @param	up     上向量
	     * @param	out    输出3x3矩阵
	     */
	    static lookAt(eye, target, up, out) {
	        Vector3.subtract(eye, target, Matrix3x3._tempV30); //WebGL为右手坐标系统
	        Vector3.normalize(Matrix3x3._tempV30, Matrix3x3._tempV30);
	        Vector3.cross(up, Matrix3x3._tempV30, Matrix3x3._tempV31);
	        Vector3.normalize(Matrix3x3._tempV31, Matrix3x3._tempV31);
	        Vector3.cross(Matrix3x3._tempV30, Matrix3x3._tempV31, Matrix3x3._tempV32);
	        var v0 = Matrix3x3._tempV30;
	        var v1 = Matrix3x3._tempV31;
	        var v2 = Matrix3x3._tempV32;
	        var me = out.elements;
	        me[0] = v1.x;
	        me[3] = v1.y;
	        me[6] = v1.z;
	        me[1] = v2.x;
	        me[4] = v2.y;
	        me[7] = v2.z;
	        me[2] = v0.x;
	        me[5] = v0.y;
	        me[8] = v0.z;
	    }
	}
	/**默认矩阵,禁止修改*/
	Matrix3x3.DEFAULT = new Matrix3x3();
	/** @internal */
	Matrix3x3._tempV30 = new Vector3();
	/** @internal */
	Matrix3x3._tempV31 = new Vector3();
	/** @internal */
	Matrix3x3._tempV32 = new Vector3();

	/**
	 * <code>Quaternion</code> 类用于创建四元数。
	 */
	class LQuaternion {
	    /**
	     * 创建一个 <code>Quaternion</code> 实例。
	     * @param	x 四元数的x值
	     * @param	y 四元数的y值
	     * @param	z 四元数的z值
	     * @param	w 四元数的w值
	     */
	    constructor(x = 0, y = 0, z = 0, w = 1, nativeElements = null /*[NATIVE]*/) {
	        this.x = x;
	        this.y = y;
	        this.z = z;
	        this.w = w;
	    }
	    /**
	     *  从欧拉角生成四元数（顺序为Yaw、Pitch、Roll）
	     * @param	yaw yaw值
	     * @param	pitch pitch值
	     * @param	roll roll值
	     * @param	out 输出四元数
	     */
	    static createFromYawPitchRoll(yaw, pitch, roll, out) {
	        var halfRoll = roll * 0.5;
	        var halfPitch = pitch * 0.5;
	        var halfYaw = yaw * 0.5;
	        var sinRoll = Math.sin(halfRoll);
	        var cosRoll = Math.cos(halfRoll);
	        var sinPitch = Math.sin(halfPitch);
	        var cosPitch = Math.cos(halfPitch);
	        var sinYaw = Math.sin(halfYaw);
	        var cosYaw = Math.cos(halfYaw);
	        out.x = (cosYaw * sinPitch * cosRoll) + (sinYaw * cosPitch * sinRoll);
	        out.y = (sinYaw * cosPitch * cosRoll) - (cosYaw * sinPitch * sinRoll);
	        out.z = (cosYaw * cosPitch * sinRoll) - (sinYaw * sinPitch * cosRoll);
	        out.w = (cosYaw * cosPitch * cosRoll) + (sinYaw * sinPitch * sinRoll);
	    }
	    /**
	     * 计算两个四元数相乘
	     * @param	left left四元数
	     * @param	right  right四元数
	     * @param	out 输出四元数
	     */
	    static multiply(left, right, out) {
	        var lx = left.x;
	        var ly = left.y;
	        var lz = left.z;
	        var lw = left.w;
	        var rx = right.x;
	        var ry = right.y;
	        var rz = right.z;
	        var rw = right.w;
	        var a = (ly * rz - lz * ry);
	        var b = (lz * rx - lx * rz);
	        var c = (lx * ry - ly * rx);
	        var d = (lx * rx + ly * ry + lz * rz);
	        out.x = (lx * rw + rx * lw) + a;
	        out.y = (ly * rw + ry * lw) + b;
	        out.z = (lz * rw + rz * lw) + c;
	        out.w = lw * rw - d;
	    }
	    static arcTanAngle(x, y) {
	        if (x == 0) {
	            if (y == 1)
	                return Math.PI / 2;
	            return -Math.PI / 2;
	        }
	        if (x > 0)
	            return Math.atan(y / x);
	        if (x < 0) {
	            if (y > 0)
	                return Math.atan(y / x) + Math.PI;
	            return Math.atan(y / x) - Math.PI;
	        }
	        return 0;
	    }
	    static angleTo(from, location, angle) {
	        Vector3.subtract(location, from, LQuaternion.TEMPVector30);
	        Vector3.normalize(LQuaternion.TEMPVector30, LQuaternion.TEMPVector30);
	        angle.x = Math.asin(LQuaternion.TEMPVector30.y);
	        angle.y = LQuaternion.arcTanAngle(-LQuaternion.TEMPVector30.z, -LQuaternion.TEMPVector30.x);
	    }
	    /**
	     * 从指定的轴和角度计算四元数
	     * @param	axis  轴
	     * @param	rad  角度
	     * @param	out  输出四元数
	     */
	    static createFromAxisAngle(axis, rad, out) {
	        rad = rad * 0.5;
	        var s = Math.sin(rad);
	        out.x = s * axis.x;
	        out.y = s * axis.y;
	        out.z = s * axis.z;
	        out.w = Math.cos(rad);
	    }
	    /**
	     *  从旋转矩阵计算四元数
	     * @param	mat 旋转矩阵
	     * @param	out  输出四元数
	     */
	    /* 	static createFromMatrix4x4(mat: Matrix4x4, out: LQuaternion): void {
	            var me: Float32Array = mat.elements;
	    
	            var sqrt: number;
	            var half: number;
	            var scale: number = me[0] + me[5] + me[10];
	    
	            if (scale > 0.0) {
	                sqrt = Math.sqrt(scale + 1.0);
	                out.w = sqrt * 0.5;
	                sqrt = 0.5 / sqrt;
	    
	                out.x = (me[6] - me[9]) * sqrt;
	                out.y = (me[8] - me[2]) * sqrt;
	                out.z = (me[1] - me[4]) * sqrt;
	            } else if ((me[0] >= me[5]) && (me[0] >= me[10])) {
	                sqrt = Math.sqrt(1.0 + me[0] - me[5] - me[10]);
	                half = 0.5 / sqrt;
	    
	                out.x = 0.5 * sqrt;
	                out.y = (me[1] + me[4]) * half;
	                out.z = (me[2] + me[8]) * half;
	                out.w = (me[6] - me[9]) * half;
	            } else if (me[5] > me[10]) {
	                sqrt = Math.sqrt(1.0 + me[5] - me[0] - me[10]);
	                half = 0.5 / sqrt;
	    
	                out.x = (me[4] + me[1]) * half;
	                out.y = 0.5 * sqrt;
	                out.z = (me[9] + me[6]) * half;
	                out.w = (me[8] - me[2]) * half;
	            } else {
	                sqrt = Math.sqrt(1.0 + me[10] - me[0] - me[5]);
	                half = 0.5 / sqrt;
	    
	                out.x = (me[8] + me[2]) * half;
	                out.y = (me[9] + me[6]) * half;
	                out.z = 0.5 * sqrt;
	                out.w = (me[1] - me[4]) * half;
	            }
	    
	        } */
	    /**
	     * 球面插值
	     * @param	left left四元数
	     * @param	right  right四元数
	     * @param	t 插值比例
	     * @param	out 输出四元数
	     * @returns 输出Float32Array
	     */
	    static slerp(left, right, t, out) {
	        var ax = left.x, ay = left.y, az = left.z, aw = left.w, bx = right.x, by = right.y, bz = right.z, bw = right.w;
	        var omega, cosom, sinom, scale0, scale1;
	        // calc cosine 
	        cosom = ax * bx + ay * by + az * bz + aw * bw;
	        // adjust signs (if necessary) 
	        if (cosom < 0.0) {
	            cosom = -cosom;
	            bx = -bx;
	            by = -by;
	            bz = -bz;
	            bw = -bw;
	        }
	        // calculate coefficients 
	        if ((1.0 - cosom) > 0.000001) {
	            // standard case (slerp) 
	            omega = Math.acos(cosom);
	            sinom = Math.sin(omega);
	            scale0 = Math.sin((1.0 - t) * omega) / sinom;
	            scale1 = Math.sin(t * omega) / sinom;
	        }
	        else {
	            // "from" and "to" quaternions are very close  
	            //  ... so we can do a linear interpolation 
	            scale0 = 1.0 - t;
	            scale1 = t;
	        }
	        // calculate final values 
	        out.x = scale0 * ax + scale1 * bx;
	        out.y = scale0 * ay + scale1 * by;
	        out.z = scale0 * az + scale1 * bz;
	        out.w = scale0 * aw + scale1 * bw;
	        return out;
	    }
	    /**
	     * 计算两个四元数的线性插值
	     * @param	left left四元数
	     * @param	right right四元数b
	     * @param	t 插值比例
	     * @param	out 输出四元数
	     */
	    static lerp(left, right, amount, out) {
	        var inverse = 1.0 - amount;
	        if (LQuaternion.dot(left, right) >= 0) {
	            out.x = (inverse * left.x) + (amount * right.x);
	            out.y = (inverse * left.y) + (amount * right.y);
	            out.z = (inverse * left.z) + (amount * right.z);
	            out.w = (inverse * left.w) + (amount * right.w);
	        }
	        else {
	            out.x = (inverse * left.x) - (amount * right.x);
	            out.y = (inverse * left.y) - (amount * right.y);
	            out.z = (inverse * left.z) - (amount * right.z);
	            out.w = (inverse * left.w) - (amount * right.w);
	        }
	        out.normalize(out);
	    }
	    /**
	     * 计算两个四元数的和
	     * @param	left  left四元数
	     * @param	right right 四元数
	     * @param	out 输出四元数
	     */
	    static add(left, right, out) {
	        out.x = left.x + right.x;
	        out.y = left.y + right.y;
	        out.z = left.z + right.z;
	        out.w = left.w + right.w;
	    }
	    /**
	     * 计算两个四元数的点积
	     * @param	left left四元数
	     * @param	right right四元数
	     * @return  点积
	     */
	    static dot(left, right) {
	        return left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
	    }
	    /**
	     * 根据缩放值缩放四元数
	     * @param	scale 缩放值
	     * @param	out 输出四元数
	     */
	    scaling(scaling, out) {
	        out.x = this.x * scaling;
	        out.y = this.y * scaling;
	        out.z = this.z * scaling;
	        out.w = this.w * scaling;
	    }
	    /**
	     * 归一化四元数
	     * @param	out 输出四元数
	     */
	    normalize(out) {
	        var len = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
	        if (len > 0) {
	            len = 1 / Math.sqrt(len);
	            out.x = this.x * len;
	            out.y = this.y * len;
	            out.z = this.z * len;
	            out.w = this.w * len;
	        }
	    }
	    /**
	     * 计算四元数的长度
	     * @return  长度
	     */
	    length() {
	        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
	    }
	    /**
	     * 根据绕X轴的角度旋转四元数
	     * @param	rad 角度
	     * @param	out 输出四元数
	     */
	    rotateX(rad, out) {
	        rad *= 0.5;
	        var bx = Math.sin(rad), bw = Math.cos(rad);
	        out.x = this.x * bw + this.w * bx;
	        out.y = this.y * bw + this.z * bx;
	        out.z = this.z * bw - this.y * bx;
	        out.w = this.w * bw - this.x * bx;
	    }
	    /**
	     * 根据绕Y轴的制定角度旋转四元数
	     * @param	rad 角度
	     * @param	out 输出四元数
	     */
	    rotateY(rad, out) {
	        rad *= 0.5;
	        var by = Math.sin(rad), bw = Math.cos(rad);
	        out.x = this.x * bw - this.z * by;
	        out.y = this.y * bw + this.w * by;
	        out.z = this.z * bw + this.x * by;
	        out.w = this.w * bw - this.y * by;
	    }
	    /**
	     * 根据绕Z轴的制定角度旋转四元数
	     * @param	rad 角度
	     * @param	out 输出四元数
	     */
	    rotateZ(rad, out) {
	        rad *= 0.5;
	        var bz = Math.sin(rad), bw = Math.cos(rad);
	        out.x = this.x * bw + this.y * bz;
	        out.y = this.y * bw - this.x * bz;
	        out.z = this.z * bw + this.w * bz;
	        out.w = this.w * bw - this.z * bz;
	    }
	    /**
	     * 分解四元数到欧拉角（顺序为Yaw、Pitch、Roll），参考自http://xboxforums.create.msdn.com/forums/p/4574/23988.aspx#23988,问题绕X轴翻转超过±90度时有，会产生瞬间反转
	     * @param	quaternion 源四元数
	     * @param	out 欧拉角值
	     */
	    // getYawPitchRoll(out: Vector3): void {
	    // 	Vector3.transformQuat(Vector3._ForwardRH, this, LQuaternion.TEMPVector31/*forwarldRH*/);
	    // 	Vector3.transformQuat(Vector3._Up, this, LQuaternion.TEMPVector32/*up*/);
	    // 	var upe: Vector3 = LQuaternion.TEMPVector32;
	    // 	LQuaternion.angleTo(Vector3._ZERO, LQuaternion.TEMPVector31, LQuaternion.TEMPVector33/*angle*/);
	    // 	var angle: Vector3 = LQuaternion.TEMPVector33;
	    // 	if (angle.x == Math.PI / 2) {
	    // 		angle.y = LQuaternion.arcTanAngle(upe.z, upe.x);
	    // 		angle.z = 0;
	    // 	} else if (angle.x == -Math.PI / 2) {
	    // 		angle.y = LQuaternion.arcTanAngle(-upe.z, -upe.x);
	    // 		angle.z = 0;
	    // 	} else {
	    // 		Matrix4x4.createRotationY(-angle.y, Matrix4x4.TEMPMatrix0);
	    // 		Matrix4x4.createRotationX(-angle.x, Matrix4x4.TEMPMatrix1);
	    // 		Vector3.transformCoordinate(LQuaternion.TEMPVector32, Matrix4x4.TEMPMatrix0, LQuaternion.TEMPVector32);
	    // 		Vector3.transformCoordinate(LQuaternion.TEMPVector32, Matrix4x4.TEMPMatrix1, LQuaternion.TEMPVector32);
	    // 		angle.z = LQuaternion.arcTanAngle(upe.y, -upe.x);
	    // 	}
	    // 	// Special cases.
	    // 	if (angle.y <= -Math.PI)
	    // 		angle.y = Math.PI;
	    // 	if (angle.z <= -Math.PI)
	    // 		angle.z = Math.PI;
	    // 	if (angle.y >= Math.PI && angle.z >= Math.PI) {
	    // 		angle.y = 0;
	    // 		angle.z = 0;
	    // 		angle.x = Math.PI - angle.x;
	    // 	}
	    // 	var oe: Vector3 = out;
	    // 	oe.x = angle.y;
	    // 	oe.y = angle.x;
	    // 	oe.z = angle.z;
	    // }
	    /**
	     * 求四元数的逆
	     * @param	out  输出四元数
	     */
	    invert(out) {
	        var a0 = this.x, a1 = this.y, a2 = this.z, a3 = this.w;
	        var dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
	        var invDot = dot ? 1.0 / dot : 0;
	        // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0
	        out.x = -a0 * invDot;
	        out.y = -a1 * invDot;
	        out.z = -a2 * invDot;
	        out.w = a3 * invDot;
	    }
	    /**
	     *设置四元数为单位算数
	     * @param out  输出四元数
	     */
	    identity() {
	        this.x = 0;
	        this.y = 0;
	        this.z = 0;
	        this.w = 1;
	    }
	    /**
	     * 从Array数组拷贝值。
	     * @param  array 数组。
	     * @param  offset 数组偏移。
	     */
	    fromArray(array, offset = 0) {
	        this.x = array[offset + 0];
	        this.y = array[offset + 1];
	        this.z = array[offset + 2];
	        this.w = array[offset + 3];
	    }
	    /**
	     * 克隆。
	     * @param	destObject 克隆源。
	     */
	    cloneTo(destObject) {
	        if (this === destObject) {
	            return;
	        }
	        destObject.x = this.x;
	        destObject.y = this.y;
	        destObject.z = this.z;
	        destObject.w = this.w;
	    }
	    /**
	     * 克隆。
	     * @return	 克隆副本。
	     */
	    clone() {
	        var dest = new LQuaternion();
	        this.cloneTo(dest);
	        return dest;
	    }
	    equals(b) {
	        return MathUtils3D.nearEqual(this.x, b.x) && MathUtils3D.nearEqual(this.y, b.y) && MathUtils3D.nearEqual(this.z, b.z) && MathUtils3D.nearEqual(this.w, b.w);
	    }
	    /**
	     * 计算旋转观察四元数
	     * @param	forward 方向
	     * @param	up     上向量
	     * @param	out    输出四元数
	     */
	    static rotationLookAt(forward, up, out) {
	        LQuaternion.lookAt(Vector3._ZERO, forward, up, out);
	    }
	    /**
	     * 计算观察四元数
	     * @param	eye    观察者位置
	     * @param	target 目标位置
	     * @param	up     上向量
	     * @param	out    输出四元数
	     */
	    static lookAt(eye, target, up, out) {
	        Matrix3x3.lookAt(eye, target, up, LQuaternion._tempMatrix3x3);
	        LQuaternion.rotationMatrix(LQuaternion._tempMatrix3x3, out);
	    }
	    /**
	     * 计算长度的平方。
	     * @return 长度的平方。
	     */
	    lengthSquared() {
	        return (this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w);
	    }
	    /**
	     * 计算四元数的逆四元数。
	     * @param	value 四元数。
	     * @param	out 逆四元数。
	     */
	    static invert(value, out) {
	        var lengthSq = value.lengthSquared();
	        if (!MathUtils3D.isZero(lengthSq)) {
	            lengthSq = 1.0 / lengthSq;
	            out.x = -value.x * lengthSq;
	            out.y = -value.y * lengthSq;
	            out.z = -value.z * lengthSq;
	            out.w = value.w * lengthSq;
	        }
	    }
	    /**
	     * 通过一个3x3矩阵创建一个四元数
	     * @param	matrix3x3  3x3矩阵
	     * @param	out        四元数
	     */
	    static rotationMatrix(matrix3x3, out) {
	        var me = matrix3x3.elements;
	        var m11 = me[0];
	        var m12 = me[1];
	        var m13 = me[2];
	        var m21 = me[3];
	        var m22 = me[4];
	        var m23 = me[5];
	        var m31 = me[6];
	        var m32 = me[7];
	        var m33 = me[8];
	        var sqrt, half;
	        var scale = m11 + m22 + m33;
	        if (scale > 0) {
	            sqrt = Math.sqrt(scale + 1);
	            out.w = sqrt * 0.5;
	            sqrt = 0.5 / sqrt;
	            out.x = (m23 - m32) * sqrt;
	            out.y = (m31 - m13) * sqrt;
	            out.z = (m12 - m21) * sqrt;
	        }
	        else if ((m11 >= m22) && (m11 >= m33)) {
	            sqrt = Math.sqrt(1 + m11 - m22 - m33);
	            half = 0.5 / sqrt;
	            out.x = 0.5 * sqrt;
	            out.y = (m12 + m21) * half;
	            out.z = (m13 + m31) * half;
	            out.w = (m23 - m32) * half;
	        }
	        else if (m22 > m33) {
	            sqrt = Math.sqrt(1 + m22 - m11 - m33);
	            half = 0.5 / sqrt;
	            out.x = (m21 + m12) * half;
	            out.y = 0.5 * sqrt;
	            out.z = (m32 + m23) * half;
	            out.w = (m31 - m13) * half;
	        }
	        else {
	            sqrt = Math.sqrt(1 + m33 - m11 - m22);
	            half = 0.5 / sqrt;
	            out.x = (m31 + m13) * half;
	            out.y = (m32 + m23) * half;
	            out.z = 0.5 * sqrt;
	            out.w = (m12 - m21) * half;
	        }
	    }
	    forNativeElement(nativeElements = null) {
	        if (nativeElements) {
	            this.elements = nativeElements;
	            this.elements[0] = this.x;
	            this.elements[1] = this.y;
	            this.elements[2] = this.z;
	            this.elements[3] = this.w;
	        }
	        else {
	            this.elements = new Float32Array([this.x, this.y, this.z, this.w]);
	        }
	        Vector2.rewriteNumProperty(this, "x", 0);
	        Vector2.rewriteNumProperty(this, "y", 1);
	        Vector2.rewriteNumProperty(this, "z", 2);
	        Vector2.rewriteNumProperty(this, "w", 3);
	    }
	}
	/**@internal */
	LQuaternion.TEMPVector30 = new Vector3();
	/**@internal */
	LQuaternion.TEMPVector31 = new Vector3();
	/**@internal */
	LQuaternion.TEMPVector32 = new Vector3();
	/**@internal */
	LQuaternion.TEMPVector33 = new Vector3();
	/**@internal */
	LQuaternion._tempMatrix3x3 = new Matrix3x3();
	/**默认矩阵,禁止修改*/
	LQuaternion.DEFAULT = new LQuaternion();
	/**无效矩阵,禁止修改*/
	LQuaternion.NAN = new LQuaternion(NaN, NaN, NaN, NaN);

	/**
	 * <code>Matrix4x4</code> 类用于创建4x4矩阵。
	 */
	class Matrix4x4 {
	    /**
	     * 创建一个 <code>Matrix4x4</code> 实例。
	     * @param	4x4矩阵的各元素
	     */
	    constructor(m11 = 1, m12 = 0, m13 = 0, m14 = 0, m21 = 0, m22 = 1, m23 = 0, m24 = 0, m31 = 0, m32 = 0, m33 = 1, m34 = 0, m41 = 0, m42 = 0, m43 = 0, m44 = 1, elements = null) {
	        var e = elements ? this.elements = elements : this.elements = new Float32Array(16); //TODO:[NATIVE]临时
	        e[0] = m11;
	        e[1] = m12;
	        e[2] = m13;
	        e[3] = m14;
	        e[4] = m21;
	        e[5] = m22;
	        e[6] = m23;
	        e[7] = m24;
	        e[8] = m31;
	        e[9] = m32;
	        e[10] = m33;
	        e[11] = m34;
	        e[12] = m41;
	        e[13] = m42;
	        e[14] = m43;
	        e[15] = m44;
	    }
	    /**
	     * 绕X轴旋转
	     * @param	rad  旋转角度
	     * @param	out 输出矩阵
	     */
	    static createRotationX(rad, out) {
	        var oe = out.elements;
	        var s = Math.sin(rad), c = Math.cos(rad);
	        oe[1] = oe[2] = oe[3] = oe[4] = oe[7] = oe[8] = oe[11] = oe[12] = oe[13] = oe[14] = 0;
	        oe[0] = oe[15] = 1;
	        oe[5] = oe[10] = c;
	        oe[6] = s;
	        oe[9] = -s;
	    }
	    /**
	     *
	     * 绕Y轴旋转
	     * @param	rad  旋转角度
	     * @param	out 输出矩阵
	     */
	    static createRotationY(rad, out) {
	        var oe = out.elements;
	        var s = Math.sin(rad), c = Math.cos(rad);
	        oe[1] = oe[3] = oe[4] = oe[6] = oe[7] = oe[9] = oe[11] = oe[12] = oe[13] = oe[14] = 0;
	        oe[5] = oe[15] = 1;
	        oe[0] = oe[10] = c;
	        oe[2] = -s;
	        oe[8] = s;
	    }
	    /**
	     * 绕Z轴旋转
	     * @param	rad  旋转角度
	     * @param	out 输出矩阵
	     */
	    static createRotationZ(rad, out) {
	        var oe = out.elements;
	        var s = Math.sin(rad), c = Math.cos(rad);
	        oe[2] = oe[3] = oe[6] = oe[7] = oe[8] = oe[9] = oe[11] = oe[12] = oe[13] = oe[14] = 0;
	        oe[10] = oe[15] = 1;
	        oe[0] = oe[5] = c;
	        oe[1] = s;
	        oe[4] = -s;
	    }
	    /**
	     * 通过yaw pitch roll旋转创建旋转矩阵。
	     * @param	yaw
	     * @param	pitch
	     * @param	roll
	     * @param	result
	     */
	    static createRotationYawPitchRoll(yaw, pitch, roll, result) {
	        LQuaternion.createFromYawPitchRoll(yaw, pitch, roll, Matrix4x4._tempQuaternion);
	        Matrix4x4.createRotationQuaternion(Matrix4x4._tempQuaternion, result);
	    }
	    /**
	     * 通过旋转轴axis和旋转角度angle计算旋转矩阵。
	     * @param	axis 旋转轴,假定已经归一化。
	     * @param	angle 旋转角度。
	     * @param	result 结果矩阵。
	     */
	    static createRotationAxis(axis, angle, result) {
	        var x = axis.x;
	        var y = axis.y;
	        var z = axis.z;
	        var cos = Math.cos(angle);
	        var sin = Math.sin(angle);
	        var xx = x * x;
	        var yy = y * y;
	        var zz = z * z;
	        var xy = x * y;
	        var xz = x * z;
	        var yz = y * z;
	        var resultE = result.elements;
	        resultE[3] = resultE[7] = resultE[11] = resultE[12] = resultE[13] = resultE[14] = 0;
	        resultE[15] = 1.0;
	        resultE[0] = xx + (cos * (1.0 - xx));
	        resultE[1] = (xy - (cos * xy)) + (sin * z);
	        resultE[2] = (xz - (cos * xz)) - (sin * y);
	        resultE[4] = (xy - (cos * xy)) - (sin * z);
	        resultE[5] = yy + (cos * (1.0 - yy));
	        resultE[6] = (yz - (cos * yz)) + (sin * x);
	        resultE[8] = (xz - (cos * xz)) + (sin * y);
	        resultE[9] = (yz - (cos * yz)) - (sin * x);
	        resultE[10] = zz + (cos * (1.0 - zz));
	    }
	    setRotation(rotation) {
	        var rotationX = rotation.x;
	        var rotationY = rotation.y;
	        var rotationZ = rotation.z;
	        var rotationW = rotation.w;
	        var xx = rotationX * rotationX;
	        var yy = rotationY * rotationY;
	        var zz = rotationZ * rotationZ;
	        var xy = rotationX * rotationY;
	        var zw = rotationZ * rotationW;
	        var zx = rotationZ * rotationX;
	        var yw = rotationY * rotationW;
	        var yz = rotationY * rotationZ;
	        var xw = rotationX * rotationW;
	        var e = this.elements;
	        e[0] = 1.0 - (2.0 * (yy + zz));
	        e[1] = 2.0 * (xy + zw);
	        e[2] = 2.0 * (zx - yw);
	        e[4] = 2.0 * (xy - zw);
	        e[5] = 1.0 - (2.0 * (zz + xx));
	        e[6] = 2.0 * (yz + xw);
	        e[8] = 2.0 * (zx + yw);
	        e[9] = 2.0 * (yz - xw);
	        e[10] = 1.0 - (2.0 * (yy + xx));
	    }
	    setPosition(position) {
	        var e = this.elements;
	        e[12] = position.x;
	        e[13] = position.y;
	        e[14] = position.z;
	    }
	    /**
	     * 通过四元数创建旋转矩阵。
	     * @param	rotation 旋转四元数。
	     * @param	result 输出旋转矩阵
	     */
	    static createRotationQuaternion(rotation, result) {
	        var resultE = result.elements;
	        var rotationX = rotation.x;
	        var rotationY = rotation.y;
	        var rotationZ = rotation.z;
	        var rotationW = rotation.w;
	        var xx = rotationX * rotationX;
	        var yy = rotationY * rotationY;
	        var zz = rotationZ * rotationZ;
	        var xy = rotationX * rotationY;
	        var zw = rotationZ * rotationW;
	        var zx = rotationZ * rotationX;
	        var yw = rotationY * rotationW;
	        var yz = rotationY * rotationZ;
	        var xw = rotationX * rotationW;
	        resultE[3] = resultE[7] = resultE[11] = resultE[12] = resultE[13] = resultE[14] = 0;
	        resultE[15] = 1.0;
	        resultE[0] = 1.0 - (2.0 * (yy + zz));
	        resultE[1] = 2.0 * (xy + zw);
	        resultE[2] = 2.0 * (zx - yw);
	        resultE[4] = 2.0 * (xy - zw);
	        resultE[5] = 1.0 - (2.0 * (zz + xx));
	        resultE[6] = 2.0 * (yz + xw);
	        resultE[8] = 2.0 * (zx + yw);
	        resultE[9] = 2.0 * (yz - xw);
	        resultE[10] = 1.0 - (2.0 * (yy + xx));
	    }
	    /**
	     * 根据平移计算输出矩阵
	     * @param	trans  平移向量
	     * @param	out 输出矩阵
	     */
	    static createTranslate(trans, out) {
	        var oe = out.elements;
	        oe[4] = oe[8] = oe[1] = oe[9] = oe[2] = oe[6] = oe[3] = oe[7] = oe[11] = 0;
	        oe[0] = oe[5] = oe[10] = oe[15] = 1;
	        oe[12] = trans.x;
	        oe[13] = trans.y;
	        oe[14] = trans.z;
	    }
	    /**
	     * 根据缩放计算输出矩阵
	     * @param	scale  缩放值
	     * @param	out 输出矩阵
	     */
	    static createScaling(scale, out) {
	        var oe = out.elements;
	        oe[0] = scale.x;
	        oe[5] = scale.y;
	        oe[10] = scale.z;
	        oe[1] = oe[4] = oe[8] = oe[12] = oe[9] = oe[13] = oe[2] = oe[6] = oe[14] = oe[3] = oe[7] = oe[11] = 0;
	        oe[15] = 1;
	    }
	    /**
	     * 计算两个矩阵的乘法
	     * @param	left left矩阵
	     * @param	right  right矩阵
	     * @param	out  输出矩阵
	     */
	    static multiply(left, right, out) {
	        var l = right.elements;
	        var r = left.elements;
	        var e = out.elements;
	        var l11 = l[0], l12 = l[1], l13 = l[2], l14 = l[3];
	        var l21 = l[4], l22 = l[5], l23 = l[6], l24 = l[7];
	        var l31 = l[8], l32 = l[9], l33 = l[10], l34 = l[11];
	        var l41 = l[12], l42 = l[13], l43 = l[14], l44 = l[15];
	        var r11 = r[0], r12 = r[1], r13 = r[2], r14 = r[3];
	        var r21 = r[4], r22 = r[5], r23 = r[6], r24 = r[7];
	        var r31 = r[8], r32 = r[9], r33 = r[10], r34 = r[11];
	        var r41 = r[12], r42 = r[13], r43 = r[14], r44 = r[15];
	        e[0] = (l11 * r11) + (l12 * r21) + (l13 * r31) + (l14 * r41);
	        e[1] = (l11 * r12) + (l12 * r22) + (l13 * r32) + (l14 * r42);
	        e[2] = (l11 * r13) + (l12 * r23) + (l13 * r33) + (l14 * r43);
	        e[3] = (l11 * r14) + (l12 * r24) + (l13 * r34) + (l14 * r44);
	        e[4] = (l21 * r11) + (l22 * r21) + (l23 * r31) + (l24 * r41);
	        e[5] = (l21 * r12) + (l22 * r22) + (l23 * r32) + (l24 * r42);
	        e[6] = (l21 * r13) + (l22 * r23) + (l23 * r33) + (l24 * r43);
	        e[7] = (l21 * r14) + (l22 * r24) + (l23 * r34) + (l24 * r44);
	        e[8] = (l31 * r11) + (l32 * r21) + (l33 * r31) + (l34 * r41);
	        e[9] = (l31 * r12) + (l32 * r22) + (l33 * r32) + (l34 * r42);
	        e[10] = (l31 * r13) + (l32 * r23) + (l33 * r33) + (l34 * r43);
	        e[11] = (l31 * r14) + (l32 * r24) + (l33 * r34) + (l34 * r44);
	        e[12] = (l41 * r11) + (l42 * r21) + (l43 * r31) + (l44 * r41);
	        e[13] = (l41 * r12) + (l42 * r22) + (l43 * r32) + (l44 * r42);
	        e[14] = (l41 * r13) + (l42 * r23) + (l43 * r33) + (l44 * r43);
	        e[15] = (l41 * r14) + (l42 * r24) + (l43 * r34) + (l44 * r44);
	    }
	    static multiplyForNative(left, right, out) {
	        Laya.LayaGL.instance.matrix4x4Multiply(left.elements, right.elements, out.elements);
	    }
	    /**
	     * 从四元数计算旋转矩阵
	     * @param	rotation 四元数
	     * @param	out 输出矩阵
	     */
	    static createFromQuaternion(rotation, out) {
	        var e = out.elements;
	        var x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;
	        var x2 = x + x;
	        var y2 = y + y;
	        var z2 = z + z;
	        var xx = x * x2;
	        var yx = y * x2;
	        var yy = y * y2;
	        var zx = z * x2;
	        var zy = z * y2;
	        var zz = z * z2;
	        var wx = w * x2;
	        var wy = w * y2;
	        var wz = w * z2;
	        e[0] = 1 - yy - zz;
	        e[1] = yx + wz;
	        e[2] = zx - wy;
	        e[3] = 0;
	        e[4] = yx - wz;
	        e[5] = 1 - xx - zz;
	        e[6] = zy + wx;
	        e[7] = 0;
	        e[8] = zx + wy;
	        e[9] = zy - wx;
	        e[10] = 1 - xx - yy;
	        e[11] = 0;
	        e[12] = 0;
	        e[13] = 0;
	        e[14] = 0;
	        e[15] = 1;
	    }
	    /**
	     * 计算仿射矩阵
	     * @param	trans 平移
	     * @param	rot 旋转
	     * @param	scale 缩放
	     * @param	out 输出矩阵
	     */
	    static createAffineTransformation(trans, rot, scale, out) {
	        var oe = out.elements;
	        var x = rot.x, y = rot.y, z = rot.z, w = rot.w, x2 = x + x, y2 = y + y, z2 = z + z;
	        var xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
	        var wx = w * x2, wy = w * y2, wz = w * z2, sx = scale.x, sy = scale.y, sz = scale.z;
	        oe[0] = (1 - (yy + zz)) * sx;
	        oe[1] = (xy + wz) * sx;
	        oe[2] = (xz - wy) * sx;
	        oe[3] = 0;
	        oe[4] = (xy - wz) * sy;
	        oe[5] = (1 - (xx + zz)) * sy;
	        oe[6] = (yz + wx) * sy;
	        oe[7] = 0;
	        oe[8] = (xz + wy) * sz;
	        oe[9] = (yz - wx) * sz;
	        oe[10] = (1 - (xx + yy)) * sz;
	        oe[11] = 0;
	        oe[12] = trans.x;
	        oe[13] = trans.y;
	        oe[14] = trans.z;
	        oe[15] = 1;
	    }
	    /**
	     * 计算观察矩阵
	     * @param	eye 视点位置
	     * @param	target 视点目标
	     * @param	up 向上向量
	     * @param	out 输出矩阵
	     */
	    static createLookAt(eye, target, up, out) {
	        var oE = out.elements;
	        var xaxis = Matrix4x4._tempVector0;
	        var yaxis = Matrix4x4._tempVector1;
	        var zaxis = Matrix4x4._tempVector2;
	        Vector3.subtract(eye, target, zaxis);
	        Vector3.normalize(zaxis, zaxis);
	        Vector3.cross(up, zaxis, xaxis);
	        Vector3.normalize(xaxis, xaxis);
	        Vector3.cross(zaxis, xaxis, yaxis);
	        oE[3] = oE[7] = oE[11] = 0;
	        oE[15] = 1;
	        oE[0] = xaxis.x;
	        oE[4] = xaxis.y;
	        oE[8] = xaxis.z;
	        oE[1] = yaxis.x;
	        oE[5] = yaxis.y;
	        oE[9] = yaxis.z;
	        oE[2] = zaxis.x;
	        oE[6] = zaxis.y;
	        oE[10] = zaxis.z;
	        oE[12] = -Vector3.dot(xaxis, eye);
	        oE[13] = -Vector3.dot(yaxis, eye);
	        oE[14] = -Vector3.dot(zaxis, eye);
	    }
	    /**
	     * 通过FOV创建透视投影矩阵。
	     * @param	fov  视角。
	     * @param	aspect 横纵比。
	     * @param	near 近裁面。
	     * @param	far 远裁面。
	     * @param	out 输出矩阵。
	     */
	    static createPerspective(fov, aspect, znear, zfar, out) {
	        var yScale = 1.0 / Math.tan(fov * 0.5);
	        var xScale = yScale / aspect;
	        var halfWidth = znear / xScale;
	        var halfHeight = znear / yScale;
	        Matrix4x4.createPerspectiveOffCenter(-halfWidth, halfWidth, -halfHeight, halfHeight, znear, zfar, out);
	    }
	    /**
	     * 创建透视投影矩阵。
	     * @param	left 视椎左边界。
	     * @param	right 视椎右边界。
	     * @param	bottom 视椎底边界。
	     * @param	top 视椎顶边界。
	     * @param	znear 视椎近边界。
	     * @param	zfar 视椎远边界。
	     * @param	out 输出矩阵。
	     */
	    static createPerspectiveOffCenter(left, right, bottom, top, znear, zfar, out) {
	        var oe = out.elements;
	        var zRange = zfar / (zfar - znear);
	        oe[1] = oe[2] = oe[3] = oe[4] = oe[6] = oe[7] = oe[12] = oe[13] = oe[15] = 0;
	        oe[0] = 2.0 * znear / (right - left);
	        oe[5] = 2.0 * znear / (top - bottom);
	        oe[8] = (left + right) / (right - left);
	        oe[9] = (top + bottom) / (top - bottom);
	        oe[10] = -zRange;
	        oe[11] = -1.0;
	        oe[14] = -znear * zRange;
	    }
	    /**
	     * 计算正交投影矩阵。
	     * @param	left 视椎左边界。
	     * @param	right 视椎右边界。
	     * @param	bottom 视椎底边界。
	     * @param	top 视椎顶边界。
	     * @param	near 视椎近边界。
	     * @param	far 视椎远边界。
	     * @param	out 输出矩阵。
	     */
	    static createOrthoOffCenter(left, right, bottom, top, znear, zfar, out) {
	        var oe = out.elements;
	        var zRange = 1.0 / (zfar - znear);
	        oe[1] = oe[2] = oe[3] = oe[4] = oe[6] = oe[8] = oe[7] = oe[9] = oe[11] = 0;
	        oe[15] = 1;
	        oe[0] = 2.0 / (right - left);
	        oe[5] = 2.0 / (top - bottom);
	        oe[10] = -zRange;
	        oe[12] = (left + right) / (left - right);
	        oe[13] = (top + bottom) / (bottom - top);
	        oe[14] = -znear * zRange;
	    }
	    getElementByRowColumn(row, column) {
	        if (row < 0 || row > 3)
	            throw new Error("row Rows and columns for matrices run from 0 to 3, inclusive.");
	        if (column < 0 || column > 3)
	            throw new Error("column Rows and columns for matrices run from 0 to 3, inclusive.");
	        return this.elements[(row * 4) + column];
	    }
	    setElementByRowColumn(row, column, value) {
	        if (row < 0 || row > 3)
	            throw new Error("row Rows and columns for matrices run from 0 to 3, inclusive.");
	        if (column < 0 || column > 3)
	            throw new Error("column Rows and columns for matrices run from 0 to 3, inclusive.");
	        this.elements[(row * 4) + column] = value;
	    }
	    /**
	     * 判断两个4x4矩阵的值是否相等。
	     * @param	other 4x4矩阵
	     */
	    equalsOtherMatrix(other) {
	        var e = this.elements;
	        var oe = other.elements;
	        return (MathUtils3D.nearEqual(e[0], oe[0]) && MathUtils3D.nearEqual(e[1], oe[1]) && MathUtils3D.nearEqual(e[2], oe[2]) && MathUtils3D.nearEqual(e[3], oe[3]) && MathUtils3D.nearEqual(e[4], oe[4]) && MathUtils3D.nearEqual(e[5], oe[5]) && MathUtils3D.nearEqual(e[6], oe[6]) && MathUtils3D.nearEqual(e[7], oe[7]) && MathUtils3D.nearEqual(e[8], oe[8]) && MathUtils3D.nearEqual(e[9], oe[9]) && MathUtils3D.nearEqual(e[10], oe[10]) && MathUtils3D.nearEqual(e[11], oe[11]) && MathUtils3D.nearEqual(e[12], oe[12]) && MathUtils3D.nearEqual(e[13], oe[13]) && MathUtils3D.nearEqual(e[14], oe[14]) && MathUtils3D.nearEqual(e[15], oe[15]));
	    }
	    /**
	     * 分解矩阵为平移向量、旋转四元数、缩放向量。
	     * @param	translation 平移向量。
	     * @param	rotation 旋转四元数。
	     * @param	scale 缩放向量。
	     * @return 是否分解成功。
	     */
	    /* 	decomposeTransRotScale(translation: Vector3, rotation: LQuaternion, scale: Vector3): boolean {
	            var rotationMatrix: Matrix4x4 = Matrix4x4._tempMatrix4x4;
	            if (this.decomposeTransRotMatScale(translation, rotationMatrix, scale)) {
	                LQuaternion.createFromMatrix4x4(rotationMatrix, rotation);
	                return true;
	            } else {
	                rotation.identity();
	                return false;
	            }
	        } */
	    /**
	     * 分解矩阵为平移向量、旋转矩阵、缩放向量。
	     * @param	translation 平移向量。
	     * @param	rotationMatrix 旋转矩阵。
	     * @param	scale 缩放向量。
	     * @return 是否分解成功。
	     */
	    decomposeTransRotMatScale(translation, rotationMatrix, scale) {
	        var e = this.elements;
	        var te = translation;
	        var re = rotationMatrix.elements;
	        var se = scale;
	        //Get the translation. 
	        te.x = e[12];
	        te.y = e[13];
	        te.z = e[14];
	        //Scaling is the length of the rows. 
	        var m11 = e[0], m12 = e[1], m13 = e[2];
	        var m21 = e[4], m22 = e[5], m23 = e[6];
	        var m31 = e[8], m32 = e[9], m33 = e[10];
	        var sX = se.x = Math.sqrt((m11 * m11) + (m12 * m12) + (m13 * m13));
	        var sY = se.y = Math.sqrt((m21 * m21) + (m22 * m22) + (m23 * m23));
	        var sZ = se.z = Math.sqrt((m31 * m31) + (m32 * m32) + (m33 * m33));
	        //If any of the scaling factors are zero, than the rotation matrix can not exist. 
	        if (MathUtils3D.isZero(sX) || MathUtils3D.isZero(sY) || MathUtils3D.isZero(sZ)) {
	            re[1] = re[2] = re[3] = re[4] = re[6] = re[7] = re[8] = re[9] = re[11] = re[12] = re[13] = re[14] = 0;
	            re[0] = re[5] = re[10] = re[15] = 1;
	            return false;
	        }
	        // Calculate an perfect orthonormal matrix (no reflections)
	        var at = Matrix4x4._tempVector0;
	        at.x = m31 / sZ;
	        at.y = m32 / sZ;
	        at.z = m33 / sZ;
	        var tempRight = Matrix4x4._tempVector1;
	        tempRight.x = m11 / sX;
	        tempRight.y = m12 / sX;
	        tempRight.z = m13 / sX;
	        var up = Matrix4x4._tempVector2;
	        Vector3.cross(at, tempRight, up);
	        var right = Matrix4x4._tempVector1;
	        Vector3.cross(up, at, right);
	        re[3] = re[7] = re[11] = re[12] = re[13] = re[14] = 0;
	        re[15] = 1;
	        re[0] = right.x;
	        re[1] = right.y;
	        re[2] = right.z;
	        re[4] = up.x;
	        re[5] = up.y;
	        re[6] = up.z;
	        re[8] = at.x;
	        re[9] = at.y;
	        re[10] = at.z;
	        // In case of reflexions//TODO:是否不用计算dot后的值即为结果
	        ((re[0] * m11 + re[1] * m12 + re[2] * m13) /*Vector3.dot(right,Right)*/ < 0.0) && (se.x = -sX);
	        ((re[4] * m21 + re[5] * m22 + re[6] * m23) /* Vector3.dot(up, Up)*/ < 0.0) && (se.y = -sY);
	        ((re[8] * m31 + re[9] * m32 + re[10] * m33) /*Vector3.dot(at, Backward)*/ < 0.0) && (se.z = -sZ);
	        return true;
	    }
	    /**
	     * 分解旋转矩阵的旋转为YawPitchRoll欧拉角。
	     * @param	out float yaw
	     * @param	out float pitch
	     * @param	out float roll
	     * @return
	     */
	    decomposeYawPitchRoll(yawPitchRoll) {
	        var pitch = Math.asin(-this.elements[9]);
	        yawPitchRoll.y = pitch;
	        // Hardcoded constant - burn him, he's a witch
	        // double threshold = 0.001; 
	        var test = Math.cos(pitch);
	        if (test > MathUtils3D.zeroTolerance) {
	            yawPitchRoll.z = Math.atan2(this.elements[1], this.elements[5]);
	            yawPitchRoll.x = Math.atan2(this.elements[8], this.elements[10]);
	        }
	        else {
	            yawPitchRoll.z = Math.atan2(-this.elements[4], this.elements[0]);
	            yawPitchRoll.x = 0.0;
	        }
	    }
	    /**
	     * 归一化矩阵
	     */
	    normalize() {
	        var v = this.elements;
	        var c = v[0], d = v[1], e = v[2], g = Math.sqrt(c * c + d * d + e * e);
	        if (g) {
	            if (g == 1)
	                return;
	        }
	        else {
	            v[0] = 0;
	            v[1] = 0;
	            v[2] = 0;
	            return;
	        }
	        g = 1 / g;
	        v[0] = c * g;
	        v[1] = d * g;
	        v[2] = e * g;
	    }
	    /**
	     * 计算矩阵的转置矩阵
	     */
	    transpose() {
	        var e, t;
	        e = this.elements;
	        t = e[1];
	        e[1] = e[4];
	        e[4] = t;
	        t = e[2];
	        e[2] = e[8];
	        e[8] = t;
	        t = e[3];
	        e[3] = e[12];
	        e[12] = t;
	        t = e[6];
	        e[6] = e[9];
	        e[9] = t;
	        t = e[7];
	        e[7] = e[13];
	        e[13] = t;
	        t = e[11];
	        e[11] = e[14];
	        e[14] = t;
	        return this;
	    }
	    /**
	     * 计算一个矩阵的逆矩阵
	     * @param	out 输出矩阵
	     */
	    invert(out) {
	        var ae = this.elements;
	        var oe = out.elements;
	        var a00 = ae[0], a01 = ae[1], a02 = ae[2], a03 = ae[3], a10 = ae[4], a11 = ae[5], a12 = ae[6], a13 = ae[7], a20 = ae[8], a21 = ae[9], a22 = ae[10], a23 = ae[11], a30 = ae[12], a31 = ae[13], a32 = ae[14], a33 = ae[15], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, 
	        // Calculate the determinant 
	        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	        if (Math.abs(det) === 0.0) {
	            return;
	        }
	        det = 1.0 / det;
	        oe[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	        oe[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	        oe[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	        oe[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	        oe[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	        oe[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	        oe[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	        oe[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	        oe[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	        oe[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	        oe[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	        oe[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	        oe[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	        oe[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	        oe[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	        oe[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
	    }
	    /**
	     * 计算BlillBoard矩阵
	     * @param	objectPosition 物体位置
	     * @param	cameraPosition 相机位置
	     * @param	cameraUp       相机上向量
	     * @param	cameraForward  相机前向量
	     * @param	mat            变换矩阵
	     */
	    static billboard(objectPosition, cameraPosition, cameraRight, cameraUp, cameraForward, mat) {
	        Vector3.subtract(objectPosition, cameraPosition, Matrix4x4._tempVector0);
	        var lengthSq = Vector3.scalarLengthSquared(Matrix4x4._tempVector0);
	        if (MathUtils3D.isZero(lengthSq)) {
	            Vector3.scale(cameraForward, -1, Matrix4x4._tempVector1);
	            Matrix4x4._tempVector1.cloneTo(Matrix4x4._tempVector0);
	        }
	        else {
	            Vector3.scale(Matrix4x4._tempVector0, 1 / Math.sqrt(lengthSq), Matrix4x4._tempVector0);
	        }
	        Vector3.cross(cameraUp, Matrix4x4._tempVector0, Matrix4x4._tempVector2);
	        Vector3.normalize(Matrix4x4._tempVector2, Matrix4x4._tempVector2);
	        Vector3.cross(Matrix4x4._tempVector0, Matrix4x4._tempVector2, Matrix4x4._tempVector3);
	        var crosse = Matrix4x4._tempVector2;
	        var finale = Matrix4x4._tempVector3;
	        var diffee = Matrix4x4._tempVector0;
	        var obpose = objectPosition;
	        var mate = mat.elements;
	        mate[0] = crosse.x;
	        mate[1] = crosse.y;
	        mate[2] = crosse.z;
	        mate[3] = 0.0;
	        mate[4] = finale.x;
	        mate[5] = finale.y;
	        mate[6] = finale.z;
	        mate[7] = 0.0;
	        mate[8] = diffee.x;
	        mate[9] = diffee.y;
	        mate[10] = diffee.z;
	        mate[11] = 0.0;
	        mate[12] = obpose.x;
	        mate[13] = obpose.y;
	        mate[14] = obpose.z;
	        mate[15] = 1.0;
	    }
	    /**设置矩阵为单位矩阵*/
	    identity() {
	        var e = this.elements;
	        e[1] = e[2] = e[3] = e[4] = e[6] = e[7] = e[8] = e[9] = e[11] = e[12] = e[13] = e[14] = 0;
	        e[0] = e[5] = e[10] = e[15] = 1;
	    }
	    /**
	     * 克隆。
	     * @param	destObject 克隆源。
	     */
	    cloneTo(destObject) {
	        var i, s, d;
	        s = this.elements;
	        d = destObject.elements;
	        if (s === d) {
	            return;
	        }
	        for (i = 0; i < 16; ++i) {
	            d[i] = s[i];
	        }
	    }
	    /**
	     * 克隆。
	     * @return	 克隆副本。
	     */
	    clone() {
	        var dest = new Matrix4x4();
	        this.cloneTo(dest);
	        return dest;
	    }
	    static translation(v3, out) {
	        var oe = out.elements;
	        oe[0] = oe[5] = oe[10] = oe[15] = 1;
	        oe[12] = v3.x;
	        oe[13] = v3.y;
	        oe[14] = v3.z;
	    }
	    /**
	     * 获取平移向量。
	     * @param	out 平移向量。
	     */
	    getTranslationVector(out) {
	        var me = this.elements;
	        out.x = me[12];
	        out.y = me[13];
	        out.z = me[14];
	    }
	    /**
	     * 设置平移向量。
	     * @param	translate 平移向量。
	     */
	    setTranslationVector(translate) {
	        var me = this.elements;
	        var ve = translate;
	        me[12] = ve.x;
	        me[13] = ve.y;
	        me[14] = ve.z;
	    }
	    /**
	     * 获取前向量。
	     * @param	out 前向量。
	     */
	    getForward(out) {
	        var me = this.elements;
	        out.x = -me[8];
	        out.y = -me[9];
	        out.z = -me[10];
	    }
	    /**
	     * 设置前向量。
	     * @param	forward 前向量。
	     */
	    setForward(forward) {
	        var me = this.elements;
	        me[8] = -forward.x;
	        me[9] = -forward.y;
	        me[10] = -forward.z;
	    }
	}
	/**@internal */
	Matrix4x4._tempMatrix4x4 = new Matrix4x4();
	/**@internal */
	Matrix4x4.TEMPMatrix0 = new Matrix4x4();
	/**@internal */
	Matrix4x4.TEMPMatrix1 = new Matrix4x4();
	/**@internal */
	Matrix4x4._tempVector0 = new Vector3();
	/**@internal */
	Matrix4x4._tempVector1 = new Vector3();
	/**@internal */
	Matrix4x4._tempVector2 = new Vector3();
	/**@internal */
	Matrix4x4._tempVector3 = new Vector3();
	/**@internal */
	Matrix4x4._tempQuaternion = new LQuaternion();
	/**默认矩阵,禁止修改*/
	Matrix4x4.DEFAULT = new Matrix4x4();
	/**默认矩阵,禁止修改*/
	Matrix4x4.ZERO = new Matrix4x4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

	/**
	 * <code>DefineDatas</code> 类用于创建宏定义数据集合。
	 */
	class DefineDatas {
	    /**
	     * 创建一个 <code>DefineDatas</code> 实例。
	     */
	    constructor() {
	        /** @internal */
	        this._mask = [];
	        /** @internal */
	        this._length = 0;
	    }
	    /**
	     * @internal
	     */
	    _intersectionDefineDatas(define) {
	        var unionMask = define._mask;
	        var mask = this._mask;
	        for (var i = this._length - 1; i >= 0; i--) {
	            var value = mask[i] & unionMask[i];
	            if (value == 0 && i == this._length - 1)
	                this._length--;
	            else
	                mask[i] = value;
	        }
	    }
	    /**
	     * 添加宏定义值。
	     * @param define 宏定义值。
	     */
	    add(define) {
	        var index = define._index;
	        var size = index + 1;
	        var mask = this._mask;
	        var maskStart = this._length; //must from this._length because this._length maybe less than mask.length and have dirty data should clear.
	        if (maskStart < size) {
	            (mask.length < size) && (mask.length = size); //mask.length maybe small than size,maybe not.
	            for (; maskStart < index; maskStart++)
	                mask[maskStart] = 0;
	            mask[index] = define._value;
	            this._length = size;
	        }
	        else {
	            if (size > this._length) { //the real length is this._length, if size is large than real length should use "= instead "|=" to ignore dirty data.
	                mask[index] = define._value;
	                this._length = size;
	            }
	            else {
	                mask[index] |= define._value;
	            }
	        }
	    }
	    /**
	     * 移除宏定义。
	     * @param define 宏定义。
	     */
	    remove(define) {
	        var index = define._index;
	        var mask = this._mask;
	        var endIndex = this._length - 1;
	        if (index > endIndex) //不重置Length,避免经常扩充
	            return;
	        var newValue = mask[index] & ~define._value;
	        if (index == endIndex && newValue === 0)
	            this._length--;
	        else
	            mask[index] = newValue;
	    }
	    /**
	     * 添加宏定义集合。
	     * @param define 宏定义集合。
	     */
	    addDefineDatas(define) {
	        var addMask = define._mask;
	        var size = define._length;
	        var mask = this._mask;
	        var maskStart = mask.length;
	        if (maskStart < size) {
	            mask.length = size;
	            for (var i = 0; i < maskStart; i++)
	                mask[i] |= addMask[i];
	            for (; maskStart < size; maskStart++)
	                mask[maskStart] = addMask[maskStart];
	            this._length = size;
	        }
	        else {
	            for (var i = 0; i < size; i++)
	                mask[i] |= addMask[i];
	            this._length = Math.max(this._length, size);
	        }
	    }
	    /**
	     * 移除宏定义集合。
	     * @param define 宏定义集合。
	     */
	    removeDefineDatas(define) {
	        var removeMask = define._mask;
	        var mask = this._mask;
	        var endIndex = this._length - 1;
	        for (var i = define._length - 1; i >= 0; i--) {
	            if (i > endIndex)
	                continue;
	            var newValue = mask[i] & ~removeMask[i];
	            if (i == endIndex && newValue === 0) {
	                endIndex--;
	                this._length--;
	            }
	            else {
	                mask[i] = newValue;
	            }
	        }
	    }
	    /**
	     * 是否有宏定义。
	     * @param define 宏定义。
	     */
	    has(define) {
	        var index = define._index;
	        if (index >= this._length)
	            return false;
	        return (this._mask[index] & define._value) !== 0;
	    }
	    /**
	     * 清空宏定义。
	     */
	    clear() {
	        this._length = 0;
	    }
	    /**
	     * 克隆。
	     * @param	destObject 克隆源。
	     */
	    cloneTo(destObject) {
	        var destDefineData = destObject;
	        var destMask = destDefineData._mask;
	        var mask = this._mask;
	        var count = this._length;
	        destMask.length = count;
	        for (var i = 0; i < count; i++)
	            destMask[i] = mask[i];
	        destDefineData._length = count;
	    }
	    /**
	     * 克隆。
	     * @return	 克隆副本。
	     */
	    clone() {
	        var dest = new DefineDatas();
	        this.cloneTo(dest);
	        return dest;
	    }
	}

	var LayaGL = Laya.LayaGL;
	// import BaseTexture = ;
	/**
	 * 着色器数据类。
	 */
	class ShaderData {
	    /**
	     * @internal
	     */
	    constructor(ownerResource = null) {
	        /**@internal */
	        this._ownerResource = null;
	        /**@internal */
	        this._data = null;
	        /** @internal */
	        this._defineDatas = new DefineDatas();
	        /**@internal [NATIVE]*/
	        this._runtimeCopyValues = [];
	        this._ownerResource = ownerResource;
	        this._initData();
	    }
	    /**
	     * @internal
	     */
	    _initData() {
	        this._data = new Object();
	    }
	    /**
	     * @internal
	     */
	    getData() {
	        return this._data;
	    }
	    /**
	     * 增加Shader宏定义。
	     * @param value 宏定义。
	     */
	    addDefine(define) {
	        this._defineDatas.add(define);
	    }
	    /**
	     * 移除Shader宏定义。
	     * @param value 宏定义。
	     */
	    removeDefine(define) {
	        this._defineDatas.remove(define);
	    }
	    /**
	     * 是否包含Shader宏定义。
	     * @param value 宏定义。
	     */
	    hasDefine(define) {
	        return this._defineDatas.has(define);
	    }
	    /**
	     * 清空宏定义。
	     */
	    clearDefine() {
	        this._defineDatas.clear();
	    }
	    /**
	     * 获取布尔。
	     * @param	index shader索引。
	     * @return  布尔。
	     */
	    getBool(index) {
	        return this._data[index];
	    }
	    /**
	     * 设置布尔。
	     * @param	index shader索引。
	     * @param	value 布尔。
	     */
	    setBool(index, value) {
	        this._data[index] = value;
	    }
	    /**
	     * 获取整形。
	     * @param	index shader索引。
	     * @return  整形。
	     */
	    getInt(index) {
	        return this._data[index];
	    }
	    /**
	     * 设置整型。
	     * @param	index shader索引。
	     * @param	value 整形。
	     */
	    setInt(index, value) {
	        this._data[index] = value;
	    }
	    /**
	     * 获取浮点。
	     * @param	index shader索引。
	     * @return  浮点。
	     */
	    getNumber(index) {
	        return this._data[index];
	    }
	    /**
	     * 设置浮点。
	     * @param	index shader索引。
	     * @param	value 浮点。
	     */
	    setNumber(index, value) {
	        this._data[index] = value;
	    }
	    /**
	     * 获取Vector2向量。
	     * @param	index shader索引。
	     * @return Vector2向量。
	     */
	    getVector2(index) {
	        return this._data[index];
	    }
	    /**
	     * 设置Vector2向量。
	     * @param	index shader索引。
	     * @param	value Vector2向量。
	     */
	    setVector2(index, value) {
	        this._data[index] = value;
	    }
	    /**
	     * 获取Vector3向量。
	     * @param	index shader索引。
	     * @return Vector3向量。
	     */
	    getVector3(index) {
	        return this._data[index];
	    }
	    /**
	     * 设置Vector3向量。
	     * @param	index shader索引。
	     * @param	value Vector3向量。
	     */
	    setVector3(index, value) {
	        this._data[index] = value;
	    }
	    /**
	     * 获取颜色。
	     * @param	index shader索引。
	     * @return 颜色向量。
	     */
	    getVector(index) {
	        return this._data[index];
	    }
	    /**
	     * 设置向量。
	     * @param	index shader索引。
	     * @param	value 向量。
	     */
	    setVector(index, value) {
	        this._data[index] = value;
	    }
	    /**
	     * 获取四元数。
	     * @param	index shader索引。
	     * @return 四元。
	     */
	    getQuaternion(index) {
	        return this._data[index];
	    }
	    /**
	     * 设置四元数。
	     * @param	index shader索引。
	     * @param	value 四元数。
	     */
	    setQuaternion(index, value) {
	        this._data[index] = value;
	    }
	    /**
	     * 获取矩阵。
	     * @param	index shader索引。
	     * @return  矩阵。
	     */
	    getMatrix4x4(index) {
	        return this._data[index];
	    }
	    /**
	     * 设置矩阵。
	     * @param	index shader索引。
	     * @param	value  矩阵。
	     */
	    setMatrix4x4(index, value) {
	        this._data[index] = value;
	    }
	    /**
	     * 获取Buffer。
	     * @param	index shader索引。
	     * @return
	     */
	    getBuffer(shaderIndex) {
	        return this._data[shaderIndex];
	    }
	    /**
	     * 设置Buffer。
	     * @param	index shader索引。
	     * @param	value  buffer数据。
	     */
	    setBuffer(index, value) {
	        this._data[index] = value;
	    }
	    /**
	     * 设置纹理。
	     * @param	index shader索引。
	     * @param	value 纹理。
	     */
	    setTexture(index, value) {
	        var lastValue = this._data[index];
	        this._data[index] = value;
	        if (this._ownerResource && this._ownerResource.referenceCount > 0) {
	            (lastValue) && (lastValue['_removeReference']());
	            (value) && (value['_addReference']());
	        }
	    }
	    /**
	     * 获取纹理。
	     * @param	index shader索引。
	     * @return  纹理。
	     */
	    getTexture(index) {
	        return this._data[index];
	    }
	    /**
	     * 设置Attribute。
	     * @param	index shader索引。
	     * @param	value 纹理。
	     */
	    setAttribute(index, value) {
	        this._data[index] = value;
	    }
	    /**
	     * 获取Attribute。
	     * @param	index shader索引。
	     * @return  纹理。
	     */
	    getAttribute(index) {
	        return this._data[index];
	    }
	    /**
	     * 获取长度。
	     * @return 长度。
	     */
	    getLength() {
	        return this._data.length;
	    }
	    /**
	     * 设置长度。
	     * @param 长度。
	     */
	    setLength(value) {
	        this._data.length = value;
	    }
	    /**
	     * 克隆。
	     * @param	destObject 克隆源。
	     */
	    cloneToForNative(destObject) {
	        var dest = destObject;
	        var diffSize = this._int32Data.length - dest._int32Data.length;
	        if (diffSize > 0) {
	            dest.needRenewArrayBufferForNative(this._int32Data.length);
	        }
	        dest._int32Data.set(this._int32Data, 0);
	        var destData = dest._nativeArray;
	        var dataCount = this._nativeArray.length;
	        destData.length = dataCount; //TODO:runtime
	        for (var i = 0; i < dataCount; i++) { //TODO:需要优化,杜绝is判断，慢
	            var value = this._nativeArray[i];
	            if (value) {
	                if (typeof (value) == 'number') {
	                    destData[i] = value;
	                    dest.setNumber(i, value);
	                }
	                else if (typeof (value) == 'number') {
	                    destData[i] = value;
	                    dest.setInt(i, value);
	                }
	                else if (typeof (value) == "boolean") {
	                    destData[i] = value;
	                    dest.setBool(i, value);
	                }
	                else if (value instanceof Vector2) {
	                    var v2 = (destData[i]) || (destData[i] = new Vector2());
	                    value.cloneTo(v2);
	                    destData[i] = v2;
	                    dest.setVector2(i, v2);
	                }
	                else if (value instanceof Vector3) {
	                    var v3 = (destData[i]) || (destData[i] = new Vector3());
	                    value.cloneTo(v3);
	                    destData[i] = v3;
	                    dest.setVector3(i, v3);
	                }
	                else if (value instanceof Vector4) {
	                    var v4 = (destData[i]) || (destData[i] = new Vector4());
	                    value.cloneTo(v4);
	                    destData[i] = v4;
	                    dest.setVector(i, v4);
	                }
	                else if (value instanceof Matrix4x4) {
	                    var mat = (destData[i]) || (destData[i] = new Matrix4x4());
	                    value.cloneTo(mat);
	                    destData[i] = mat;
	                    dest.setMatrix4x4(i, mat);
	                }
	                else if (value instanceof Laya.BaseTexture) {
	                    destData[i] = value;
	                    dest.setTexture(i, value);
	                }
	            }
	        }
	        this._defineDatas.cloneTo(dest._defineDatas);
	    }
	    /**
	     * @internal [NATIVE]
	     */
	    _initDataForNative() {
	        var length = 8; //默认分配8个
	        this._frameCount = -1;
	        this._runtimeCopyValues.length = 0;
	        this._nativeArray = [];
	        this._data = new ArrayBuffer(length * 4);
	        this._int32Data = new Int32Array(this._data);
	        this._float32Data = new Float32Array(this._data);
	        LayaGL.instance.createArrayBufferRef(this._data, LayaGL.ARRAY_BUFFER_TYPE_DATA, true);
	    }
	    needRenewArrayBufferForNative(index) {
	        if (index >= this._int32Data.length) {
	            var nByteLen = (index + 1) * 4;
	            var pre = this._int32Data;
	            var preConchRef = this._data["conchRef"];
	            var prePtrID = this._data["_ptrID"];
	            this._data = new ArrayBuffer(nByteLen);
	            this._int32Data = new Int32Array(this._data);
	            this._float32Data = new Float32Array(this._data);
	            this._data["conchRef"] = preConchRef;
	            this._data["_ptrID"] = prePtrID;
	            pre && this._int32Data.set(pre, 0);
	            var layagl = LayaGL.instance;
	            if (layagl.updateArrayBufferRef) {
	                layagl.updateArrayBufferRef(this._data['_ptrID'], preConchRef.isSyncToRender(), this._data);
	            }
	            else {
	                window.conch.updateArrayBufferRef(this._data['_ptrID'], preConchRef.isSyncToRender(), this._data);
	            }
	        }
	    }
	    getDataForNative() {
	        return this._nativeArray;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getIntForNative(index) {
	        return this._int32Data[index];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setIntForNative(index, value) {
	        this.needRenewArrayBufferForNative(index);
	        this._int32Data[index] = value;
	        this._nativeArray[index] = value;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getBoolForNative(index) {
	        return this._int32Data[index] == 1;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setBoolForNative(index, value) {
	        this.needRenewArrayBufferForNative(index);
	        this._int32Data[index] = value ? 1 : 0;
	        this._nativeArray[index] = value;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getNumberForNative(index) {
	        return this._float32Data[index];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setNumberForNative(index, value) {
	        this.needRenewArrayBufferForNative(index);
	        this._float32Data[index] = value;
	        this._nativeArray[index] = value;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getMatrix4x4ForNative(index) {
	        return this._nativeArray[index];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setMatrix4x4ForNative(index, value) {
	        this.needRenewArrayBufferForNative(index);
	        this._nativeArray[index] = value; //保存引用
	        var nPtrID = this.setReferenceForNative(value.elements);
	        this._int32Data[index] = nPtrID;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getVectorForNative(index) {
	        return this._nativeArray[index];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setVectorForNative(index, value) {
	        this.needRenewArrayBufferForNative(index);
	        this._nativeArray[index] = value; //保存引用
	        if (!value.elements) {
	            value.forNativeElement();
	        }
	        var nPtrID = this.setReferenceForNative(value.elements);
	        this._int32Data[index] = nPtrID;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getVector2ForNative(index) {
	        return this._nativeArray[index];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setVector2ForNative(index, value) {
	        this.needRenewArrayBufferForNative(index);
	        this._nativeArray[index] = value; //保存引用
	        if (!value.elements) {
	            value.forNativeElement();
	        }
	        var nPtrID = this.setReferenceForNative(value.elements);
	        this._int32Data[index] = nPtrID;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getVector3ForNative(index) {
	        return this._nativeArray[index];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setVector3ForNative(index, value) {
	        this.needRenewArrayBufferForNative(index);
	        this._nativeArray[index] = value; //保存引用
	        if (!value.elements) {
	            value.forNativeElement();
	        }
	        var nPtrID = this.setReferenceForNative(value.elements);
	        this._int32Data[index] = nPtrID;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getQuaternionForNative(index) {
	        return this._nativeArray[index];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setQuaternionForNative(index, value) {
	        this.needRenewArrayBufferForNative(index);
	        this._nativeArray[index] = value; //保存引用
	        if (!value.elements) {
	            value.forNativeElement();
	        }
	        var nPtrID = this.setReferenceForNative(value.elements);
	        this._int32Data[index] = nPtrID;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getBufferForNative(shaderIndex) {
	        return this._nativeArray[shaderIndex];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setBufferForNative(index, value) {
	        this.needRenewArrayBufferForNative(index);
	        this._nativeArray[index] = value; //保存引用
	        var nPtrID = this.setReferenceForNative(value);
	        this._int32Data[index] = nPtrID;
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getAttributeForNative(index) {
	        return this._nativeArray[index];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setAttributeForNative(index, value) {
	        this._nativeArray[index] = value; //保存引用
	        if (!value["_ptrID"]) {
	            LayaGL.instance.createArrayBufferRef(value, LayaGL.ARRAY_BUFFER_TYPE_DATA, true);
	        }
	        LayaGL.instance.syncBufferToRenderThread(value);
	        this._int32Data[index] = value["_ptrID"];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    getTextureForNative(index) {
	        return this._nativeArray[index];
	    }
	    /**
	     *@internal [NATIVE]
	     */
	    setTextureForNative(index, value) {
	        if (!value)
	            return;
	        this.needRenewArrayBufferForNative(index);
	        var lastValue = this._nativeArray[index];
	        this._nativeArray[index] = value; //保存引用
	        var glTexture = value['_getSource']() || value.defaulteTexture['_getSource']();
	        this._int32Data[index] = glTexture.id;
	        if (this._ownerResource && this._ownerResource.referenceCount > 0) {
	            (lastValue) && (lastValue['_removeReference']());
	            (value) && (value['_addReference']());
	        }
	    }
	    setReferenceForNative(value) {
	        //清空保存的数据
	        this.clearRuntimeCopyArray();
	        var nRefID = 0;
	        var nPtrID = 0;
	        if (ShaderData._SET_RUNTIME_VALUE_MODE_REFERENCE_) {
	            LayaGL.instance.createArrayBufferRefs(value, LayaGL.ARRAY_BUFFER_TYPE_DATA, true, LayaGL.ARRAY_BUFFER_REF_REFERENCE);
	            nRefID = 0;
	            nPtrID = value.getPtrID(nRefID);
	        }
	        else {
	            LayaGL.instance.createArrayBufferRefs(value, LayaGL.ARRAY_BUFFER_TYPE_DATA, true, LayaGL.ARRAY_BUFFER_REF_COPY);
	            nRefID = value.getRefNum() - 1;
	            nPtrID = value.getPtrID(nRefID);
	            //TODO 应该只用到value
	            this._runtimeCopyValues.push({ "obj": value, "refID": nRefID, "ptrID": nPtrID });
	        }
	        LayaGL.instance.syncBufferToRenderThread(value, nRefID);
	        return nPtrID;
	    }
	    static setRuntimeValueMode(bReference) {
	        ShaderData._SET_RUNTIME_VALUE_MODE_REFERENCE_ = bReference;
	    }
	    clearRuntimeCopyArray() {
	        var currentFrame = Laya.Stat.loopCount;
	        if (this._frameCount != currentFrame) {
	            this._frameCount = currentFrame;
	            for (var i = 0, n = this._runtimeCopyValues.length; i < n; i++) {
	                var obj = this._runtimeCopyValues[i];
	                obj.obj.clearRefNum();
	            }
	            this._runtimeCopyValues.length = 0;
	        }
	    }
	}
	/**@internal [NATIVE]*/
	ShaderData._SET_RUNTIME_VALUE_MODE_REFERENCE_ = true;

	class ShaderDefine {
	    constructor(index, value) {
	        this._index = index;
	        this._value = value;
	    }
	}

	/**
	 * <code>VertexBuffer3D</code> 类用于创建顶点缓冲。
	 */
	class VertexBuffer3D extends Laya.Buffer {
	    /**
	     * 创建一个 <code>VertexBuffer3D</code> 实例。
	     * @param	byteLength 字节长度。
	     * @param	bufferUsage VertexBuffer3D用途类型。
	     * @param	canRead 是否可读。
	     */
	    constructor(byteLength, bufferUsage, canRead = false) {
	        super();
	        /** @internal */
	        this._vertexDeclaration = null;
	        /** @internal */
	        this._float32Reader = null;
	        var gl = Laya.LayaGL.instance;
	        this._bufferUsage = bufferUsage;
	        this._bufferType = gl.ARRAY_BUFFER;
	        this._canRead = canRead;
	        this._byteLength = byteLength;
	        this.bind();
	        gl.bufferData(this._bufferType, this._byteLength, this._bufferUsage);
	        if (canRead) {
	            this._buffer = new Uint8Array(byteLength);
	            this._float32Reader = new Float32Array(this._buffer.buffer);
	        }
	    }
	    /**
	     * 获取顶点声明。
	     */
	    get vertexDeclaration() {
	        return this._vertexDeclaration;
	    }
	    set vertexDeclaration(value) {
	        this._vertexDeclaration = value;
	    }
	    /**
	     * 是否可读。
	     */
	    get canRead() {
	        return this._canRead;
	    }
	    /**
	     * @inheritDoc
	     * @override
	     */
	    bind() {
	        if (Laya.Buffer._bindedVertexBuffer !== this._glBuffer) {
	            var gl = Laya.LayaGL.instance;
	            gl.bindBuffer(gl.ARRAY_BUFFER, this._glBuffer);
	            Laya.Buffer._bindedVertexBuffer = this._glBuffer;
	            return true;
	        }
	        else {
	            return false;
	        }
	    }
	    /**
	     * 剥离内存块存储。
	     */
	    orphanStorage() {
	        this.bind();
	        Laya.LayaGL.instance.bufferData(this._bufferType, this._byteLength, this._bufferUsage);
	    }
	    /**
	     * 设置数据。
	     * @param	data 顶点数据。
	     * @param	bufferOffset 顶点缓冲中的偏移,以字节为单位。
	     * @param	dataStartIndex 顶点数据的偏移,以字节为单位。
	     * @param	dataCount 顶点数据的长度,以字节为单位。
	     */
	    setData(buffer, bufferOffset = 0, dataStartIndex = 0, dataCount = Number.MAX_SAFE_INTEGER) {
	        this.bind();
	        var needSubData = dataStartIndex !== 0 || dataCount !== Number.MAX_SAFE_INTEGER;
	        if (needSubData) {
	            var subData = new Uint8Array(buffer, dataStartIndex, dataCount);
	            Laya.LayaGL.instance.bufferSubData(this._bufferType, bufferOffset, subData);
	            if (this._canRead)
	                this._buffer.set(subData, bufferOffset);
	        }
	        else {
	            Laya.LayaGL.instance.bufferSubData(this._bufferType, bufferOffset, buffer);
	            if (this._canRead)
	                this._buffer.set(new Uint8Array(buffer), bufferOffset);
	        }
	    }
	    /**
	     * 获取顶点数据。
	     * @return	顶点数据。
	     */
	    getUint8Data() {
	        if (this._canRead)
	            return this._buffer;
	        else
	            throw new Error("Can't read data from VertexBuffer with only write flag!");
	    }
	    /**
	     * @ignore
	     */
	    getFloat32Data() {
	        if (this._canRead)
	            return this._float32Reader;
	        else
	            throw new Error("Can't read data from VertexBuffer with only write flag!");
	    }
	    /**
	     * @ignore
	     */
	    markAsUnreadbale() {
	        this._canRead = false;
	        this._buffer = null;
	        this._float32Reader = null;
	    }
	    /**
	     * @inheritDoc
	     * @override
	     */
	    destroy() {
	        super.destroy();
	        this._buffer = null;
	        this._float32Reader = null;
	        this._vertexDeclaration = null;
	    }
	}
	/**数据类型_Float32Array类型。*/
	VertexBuffer3D.DATATYPE_FLOAT32ARRAY = 0;
	/**数据类型_Uint8Array类型。*/
	VertexBuffer3D.DATATYPE_UINT8ARRAY = 1;

	/**
	 * ...
	 * @author ...
	 */
	class VertexElementFormat {
	    static __init__() {
	        var gl = Laya.LayaGL.instance;
	        VertexElementFormat._elementInfos = {
	            "single": [1, gl.FLOAT, 0],
	            "vector2": [2, gl.FLOAT, 0],
	            "vector3": [3, gl.FLOAT, 0],
	            "vector4": [4, gl.FLOAT, 0],
	            "color": [4, gl.FLOAT, 0],
	            "byte4": [4, gl.UNSIGNED_BYTE, 0],
	            "short2": [2, gl.FLOAT, 0],
	            "short4": [4, gl.FLOAT, 0],
	            "normalizedshort2": [2, gl.FLOAT, 0],
	            "normalizedshort4": [4, gl.FLOAT, 0],
	            "halfvector2": [2, gl.FLOAT, 0],
	            "halfvector4": [4, gl.FLOAT, 0]
	        };
	    }
	    /**
	     * 获取顶点元素格式信息。
	     */
	    static getElementInfos(element) {
	        var info = VertexElementFormat._elementInfos[element];
	        if (info)
	            return info;
	        else
	            throw "VertexElementFormat: this vertexElementFormat is not implement.";
	    }
	}
	VertexElementFormat.Single = "single";
	VertexElementFormat.Vector2 = "vector2";
	VertexElementFormat.Vector3 = "vector3";
	VertexElementFormat.Vector4 = "vector4";
	VertexElementFormat.Color = "color";
	VertexElementFormat.Byte4 = "byte4";
	VertexElementFormat.Short2 = "short2";
	VertexElementFormat.Short4 = "short4";
	VertexElementFormat.NormalizedShort2 = "normalizedshort2";
	VertexElementFormat.NormalizedShort4 = "normalizedshort4";
	VertexElementFormat.HalfVector2 = "halfvector2";
	VertexElementFormat.HalfVector4 = "halfvector4";

	/**
	 * <code>VertexDeclaration</code> 类用于生成顶点声明。
	 */
	class VertexDeclaration {
	    /**
	     * 创建一个 <code>VertexDeclaration</code> 实例。
	     * @param	vertexStride 顶点跨度。
	     * @param	vertexElements 顶点元素集合。
	     */
	    constructor(vertexStride, vertexElements) {
	        this._id = ++VertexDeclaration._uniqueIDCounter;
	        this._vertexElementsDic = {};
	        this._vertexStride = vertexStride;
	        this._vertexElements = vertexElements;
	        var count = vertexElements.length;
	        this._shaderValues = new ShaderData(null);
	        for (var j = 0; j < count; j++) {
	            var vertexElement = vertexElements[j];
	            var name = vertexElement._elementUsage;
	            this._vertexElementsDic[name] = vertexElement;
	            var value = new Int32Array(5);
	            var elmentInfo = VertexElementFormat.getElementInfos(vertexElement._elementFormat);
	            value[0] = elmentInfo[0];
	            value[1] = elmentInfo[1];
	            value[2] = elmentInfo[2];
	            value[3] = this._vertexStride;
	            value[4] = vertexElement._offset;
	            this._shaderValues.setAttribute(name, value);
	        }
	    }
	    /**
	     * 获取唯一标识ID(通常用于优化或识别)。
	     * @return 唯一标识ID
	     */
	    get id() {
	        return this._id;
	    }
	    /**
	     * 顶点跨度，以字节为单位。
	     */
	    get vertexStride() {
	        return this._vertexStride;
	    }
	    /**
	     * 顶点元素的数量。
	     */
	    get vertexElementCount() {
	        return this._vertexElements.length;
	    }
	    /**
	     * 通过索引获取顶点元素。
	     * @param index 索引。
	     */
	    getVertexElementByIndex(index) {
	        return this._vertexElements[index];
	    }
	    /**
	     * @internal
	     */
	    getVertexElementByUsage(usage) {
	        return this._vertexElementsDic[usage];
	    }
	}
	/**@internal */
	VertexDeclaration._uniqueIDCounter = 1;

	/**
	* <code>VertexElement</code> 类用于创建顶点结构分配。
	*/
	class VertexElement {
	    constructor(offset, elementFormat, elementUsage) {
	        this._offset = offset;
	        this._elementFormat = elementFormat;
	        this._elementUsage = elementUsage;
	        //this.usageIndex = usageIndex;
	    }
	    //usageIndex:int;//TODO:待确定是否添加
	    get offset() {
	        return this._offset;
	    }
	    get elementFormat() {
	        return this._elementFormat;
	    }
	    get elementUsage() {
	        return this._elementUsage;
	    }
	}

	/**
	 * ...
	 * @author ...
	 */
	class VertexMesh {
	    /**
	     * @internal
	     */
	    static __init__() {
	        VertexMesh.instanceWorldMatrixDeclaration = new VertexDeclaration(64, [new VertexElement(0, VertexElementFormat.Vector4, VertexMesh.MESH_WORLDMATRIX_ROW0),
	            new VertexElement(16, VertexElementFormat.Vector4, VertexMesh.MESH_WORLDMATRIX_ROW1),
	            new VertexElement(32, VertexElementFormat.Vector4, VertexMesh.MESH_WORLDMATRIX_ROW2),
	            new VertexElement(48, VertexElementFormat.Vector4, VertexMesh.MESH_WORLDMATRIX_ROW3)]);
	        VertexMesh.instanceMVPMatrixDeclaration = new VertexDeclaration(64, [new VertexElement(0, VertexElementFormat.Vector4, VertexMesh.MESH_MVPMATRIX_ROW0),
	            new VertexElement(16, VertexElementFormat.Vector4, VertexMesh.MESH_MVPMATRIX_ROW1),
	            new VertexElement(32, VertexElementFormat.Vector4, VertexMesh.MESH_MVPMATRIX_ROW2),
	            new VertexElement(48, VertexElementFormat.Vector4, VertexMesh.MESH_MVPMATRIX_ROW3)]);
	    }
	    /**
	     * 获取顶点声明。
	     * @param vertexFlag 顶点声明标记字符,格式为:"POSITION,NORMAL,COLOR,UV,UV1,BLENDWEIGHT,BLENDINDICES,TANGENT"。
	     * @return 顶点声明。
	     */
	    static getVertexDeclaration(vertexFlag, compatible = true) {
	        var verDec = VertexMesh._vertexDeclarationMap[vertexFlag + (compatible ? "_0" : "_1")]; //TODO:兼容模式
	        if (!verDec) {
	            var subFlags = vertexFlag.split(",");
	            var offset = 0;
	            var elements = [];
	            for (var i = 0, n = subFlags.length; i < n; i++) {
	                var element;
	                switch (subFlags[i]) {
	                    case "POSITION":
	                        element = new VertexElement(offset, VertexElementFormat.Vector3, VertexMesh.MESH_POSITION0);
	                        offset += 12;
	                        break;
	                    case "NORMAL":
	                        element = new VertexElement(offset, VertexElementFormat.Vector3, VertexMesh.MESH_NORMAL0);
	                        offset += 12;
	                        break;
	                    case "COLOR":
	                        element = new VertexElement(offset, VertexElementFormat.Vector4, VertexMesh.MESH_COLOR0);
	                        offset += 16;
	                        break;
	                    case "UV":
	                        element = new VertexElement(offset, VertexElementFormat.Vector2, VertexMesh.MESH_TEXTURECOORDINATE0);
	                        offset += 8;
	                        break;
	                    case "UV1":
	                        element = new VertexElement(offset, VertexElementFormat.Vector2, VertexMesh.MESH_TEXTURECOORDINATE1);
	                        offset += 8;
	                        break;
	                    case "BLENDWEIGHT":
	                        element = new VertexElement(offset, VertexElementFormat.Vector4, VertexMesh.MESH_BLENDWEIGHT0);
	                        offset += 16;
	                        break;
	                    case "BLENDINDICES":
	                        if (compatible) {
	                            element = new VertexElement(offset, VertexElementFormat.Vector4, VertexMesh.MESH_BLENDINDICES0); //兼容
	                            offset += 16;
	                        }
	                        else {
	                            element = new VertexElement(offset, VertexElementFormat.Byte4, VertexMesh.MESH_BLENDINDICES0);
	                            offset += 4;
	                        }
	                        break;
	                    case "TANGENT":
	                        element = new VertexElement(offset, VertexElementFormat.Vector4, VertexMesh.MESH_TANGENT0);
	                        offset += 16;
	                        break;
	                    default:
	                        throw "VertexMesh: unknown vertex flag.";
	                }
	                elements.push(element);
	            }
	            verDec = new VertexDeclaration(offset, elements);
	            VertexMesh._vertexDeclarationMap[vertexFlag + (compatible ? "_0" : "_1")] = verDec; //TODO:兼容模式
	        }
	        return verDec;
	    }
	}
	VertexMesh.MESH_POSITION0 = 0;
	VertexMesh.MESH_COLOR0 = 6;
	VertexMesh.MESH_TEXTURECOORDINATE0 = 1;
	VertexMesh.MESH_NORMAL0 = 4;
	VertexMesh.MESH_TANGENT0 = 5;
	VertexMesh.MESH_BLENDINDICES0 = 2;
	VertexMesh.MESH_BLENDWEIGHT0 = 3;
	VertexMesh.MESH_TEXTURECOORDINATE1 = 7;
	VertexMesh.MESH_WORLDMATRIX_ROW0 = 8;
	VertexMesh.MESH_WORLDMATRIX_ROW1 = 9;
	VertexMesh.MESH_WORLDMATRIX_ROW2 = 10;
	VertexMesh.MESH_WORLDMATRIX_ROW3 = 11;
	VertexMesh.MESH_MVPMATRIX_ROW0 = 12;
	VertexMesh.MESH_MVPMATRIX_ROW1 = 13;
	VertexMesh.MESH_MVPMATRIX_ROW2 = 14;
	VertexMesh.MESH_MVPMATRIX_ROW3 = 15;
	/**@internal */
	VertexMesh._vertexDeclarationMap = {};

	class Vector2D {
	    constructor($x = 0, $y = 0) {
	        this.x = 0;
	        this.y = 0;
	        this.x = $x;
	        this.y = $y;
	    }
	    normalize() {
	        var le = this.length;
	        if (le == 0) {
	            return;
	        }
	        this.scaleBy(1 / le);
	    }
	    get length() {
	        return Math.sqrt(this.x * this.x + this.y * this.y);
	    }
	    /**
	     * 设置角度  (X轴夹角,弧度)
	     * @param value
	     *
	     */
	    set vAngle(value) {
	        var len = length;
	        this.x = Math.cos(value) * len;
	        this.y = Math.sin(value) * len;
	    }
	    /**
	     * 获取角度,弧度
	     * @return
	     *
	     */
	    get vAngle() {
	        return Math.atan2(this.y, this.x);
	    }
	    /**
	     * 设置向量的大小
	     * @param value
	     *
	     */
	    set length(value) {
	        var a = this.vAngle;
	        this.x = Math.cos(a) * value;
	        this.y = Math.sin(a) * value;
	    }
	    scaleBy(value) {
	        this.x *= value;
	        this.y *= value;
	    }
	    sub(val) {
	        return new Vector2D(val.x - this.x, val.y - this.y);
	    }
	    add(val) {
	        return new Vector2D(val.x + this.x, val.y + this.y);
	    }
	    toString() {
	        return "Vector2D(" + String(this.x) + "," + String(this.y) + ")";
	    }
	    static distance(p1, p2) {
	        var xx = p1.x - p2.x;
	        var yy = p1.y - p2.y;
	        return Math.sqrt(xx * xx + yy * yy);
	    }
	    subtract(value) {
	        return new Vector2D(this.x - value.x, this.y - value.y);
	    }
	}

	class CanvasPostionModel {
	    constructor() {
	        this.tureMoveV2d = new Vector2D(0, 0);
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new CanvasPostionModel();
	        }
	        return this._instance;
	    }
	    resetSize() {
	        let scaleZ = Scene_data.SCALE_Z;
	        let halfScreenW = Laya.stage.width / 2;
	        let halfScreenH = Laya.stage.height / 2;
	        let f = Scene_data.focus3D;
	        f.x = 0 + halfScreenW;
	        f.z = 0 - halfScreenH * scaleZ;
	        f.x -= this.tureMoveV2d.x;
	        f.z += this.tureMoveV2d.y * scaleZ;
	    }
	}
	/**
	 * 2.5d旋转角度
	 */
	CanvasPostionModel.SCENE_2D_ROTATION_45 = 30;

	class Scene_data {
	    static set viewMatrx3D(value) {
	        Scene_data._viewMatrx3D = value;
	    }
	    static get viewMatrx3D() {
	        return Scene_data._viewMatrx3D;
	    }
	}
	Scene_data.sceneViewHW = 500;
	Scene_data.fileRoot = "res/";
	Scene_data.verticalScene = false;
	Scene_data.effectsLev = 2; //2高配1中配0低配
	Scene_data.camFar = 1000; //镜头最远距离
	Scene_data.frameTime = 1000 / 60;
	Scene_data.MAX_NUMBER = 10000000;
	Scene_data.user = 0; //0为小刘，1为pan
	Scene_data.scaleLight = [2.0];
	Scene_data.useByte = true;
	Scene_data.fogColor = [0, 0, 0];
	Scene_data.fogData = [1000, 0.003];
	Scene_data.gameAngle = 0;
	Scene_data.sceneNumId = 0;
	Scene_data.supportBlob = false;
	/**
	 * z平面放大倍数
	 */
	Scene_data.SCALE_Z = 1 / Math.sin(CanvasPostionModel.SCENE_2D_ROTATION_45 * Math.PI / 180);

	class Vector3D {
	    constructor($x = 0, $y = 0, $z = 0, $w = 1) {
	        this.x = 0;
	        this.y = 0;
	        this.z = 0;
	        this.w = 1;
	        this.x = $x;
	        this.y = $y;
	        this.z = $z;
	        this.w = $w;
	    }
	    normalize() {
	        var le = this.length;
	        if (le == 0) {
	            return;
	        }
	        this.scaleBy(1 / le);
	    }
	    get length() {
	        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	    }
	    scaleBy(value) {
	        this.x *= value;
	        this.y *= value;
	        this.z *= value;
	        this.w *= value;
	    }
	    divideScalar(value) {
	        if (value != 0) {
	            this.x = this.x / value;
	            this.y = this.y / value;
	            this.z = this.z / value;
	        }
	        else {
	            this.x = 0;
	            this.y = 0;
	            this.z = 0;
	        }
	    }
	    distanceToSquared(v) {
	        return Vector3D.distance(this, v);
	    }
	    scaleByW() {
	        this.x *= this.w;
	        this.y *= this.w;
	        this.z *= this.w;
	    }
	    add(value) {
	        return new Vector3D(this.x + value.x, this.y + value.y, this.z + value.z);
	    }
	    subtract(value) {
	        return new Vector3D(this.x - value.x, this.y - value.y, this.z - value.z);
	    }
	    addByNum($x, $y, $z, $w = 0) {
	        this.x += $x;
	        this.y += $y;
	        this.z += $z;
	        this.w += $w;
	    }
	    setTo($x, $y, $z) {
	        this.x = $x;
	        this.y = $y;
	        this.z = $z;
	    }
	    setByte(byte) {
	        this.x = byte.readFloat();
	        this.y = byte.readFloat();
	        this.z = byte.readFloat();
	    }
	    cross(value) {
	        return new Vector3D(this.y * value.z - this.z * value.y, this.z * value.x - this.x * value.z, this.x * value.y - this.y * value.x);
	    }
	    dot(value) {
	        return this.x * value.x + this.y * value.y + this.z * value.z;
	    }
	    clone() {
	        return new Vector3D(this.x, this.y, this.z);
	    }
	    static distance(v1, v2) {
	        var x1 = v1.x - v2.x;
	        var y1 = v1.y - v2.y;
	        var z1 = v1.z - v2.z;
	        return Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1);
	    }
	    toString() {
	        return "Vector3D(" + String(this.x) + "," + String(this.y) + "," + String(this.z) + "," + String(this.w) + ")";
	    }
	}
	Vector3D.X_AXIS = new Vector3D(1, 0, 0);
	Vector3D.Y_AXIS = new Vector3D(0, 1, 0);
	Vector3D.Z_AXIS = new Vector3D(0, 0, 1);

	/**
	 * Endian 类中包含一些值，它们表示用于表示多字节数字的字节顺序。
	 * 字节顺序为 bigEndian（最高有效字节位于最前）或 littleEndian（最低有效字节位于最前）。
	 * @class egret.Endian
	 * @classdesc
	 */
	class Endian {
	}
	/**
	 * 表示多字节数字的最低有效字节位于字节序列的最前面。
	 * 十六进制数字 0x12345678 包含 4 个字节（每个字节包含 2 个十六进制数字）。最高有效字节为 0x12。最低有效字节为 0x78。（对于等效的十进制数字 305419896，最高有效数字是 3，最低有效数字是 6）。
	 * @constant {string} egret.Endian.LITTLE_ENDIAN
	 */
	Endian.LITTLE_ENDIAN = "littleEndian";
	/**
	 * 表示多字节数字的最高有效字节位于字节序列的最前面。
	 * 十六进制数字 0x12345678 包含 4 个字节（每个字节包含 2 个十六进制数字）。最高有效字节为 0x12。最低有效字节为 0x78。（对于等效的十进制数字 305419896，最高有效数字是 3，最低有效数字是 6）。
	 * @constant {string} egret.Endian.BIG_ENDIAN
	 */
	Endian.BIG_ENDIAN = "bigEndian";
	/**
	 * @class ByteArray
	 * @classdesc
	 * ByteArray 类提供用于优化读取、写入以及处理二进制数据的方法和属性。
	 * 注意：ByteArray 类适用于需要在字节层访问数据的高级 开发人员。
	 */
	class Pan3dByteArray {
	    /**
	     * 创建一个 ByteArray 对象以引用指定的 ArrayBuffer 对象
	     * @param buffer {ArrayBuffer} 数据源
	     */
	    constructor(buffer) {
	        this.BUFFER_EXT_SIZE = 0; //Buffer expansion size
	        this.optcode = 0;
	        this.EOF_byte = -1;
	        this.EOF_code_point = -1;
	        this._setArrayBuffer(buffer || new ArrayBuffer(this.BUFFER_EXT_SIZE));
	        this.endian = Endian.BIG_ENDIAN;
	    }
	    _setArrayBuffer(buffer) {
	        this.write_position = buffer.byteLength;
	        this.data = new DataView(buffer);
	        this._position = 0;
	    }
	    setdata(srcByte) {
	        this._setArrayBuffer(srcByte.buffer);
	    }
	    get buffer() {
	        return this.data.buffer;
	    }
	    /**
	     * @private
	     */
	    set buffer(value) {
	        this.data = new DataView(value);
	    }
	    get dataView() {
	        return this.data;
	    }
	    /**
	     * @private
	     */
	    set dataView(value) {
	        this.data = value;
	        this.write_position = value.byteLength;
	    }
	    /**
	     * @private
	     */
	    get bufferOffset() {
	        return this.data.byteOffset;
	    }
	    getByte(i) {
	        return this.data.getUint8(i);
	    }
	    setByte(i, num) {
	        this.data.setUint8(i, num);
	    }
	    /**
	     * 将文件指针的当前位置（以字节为单位）移动或返回到 ByteArray 对象中。下一次调用读取方法时将在此位置开始读取，或者下一次调用写入方法时将在此位置开始写入。
	     * @member {number} ByteArray#position
	     */
	    get position() {
	        return this._position;
	    }
	    set position(value) {
	        //if (this._position < value) {
	        //    if (!this.validate(value - this._position)) {
	        //        return;
	        //    }
	        //}
	        this._position = value;
	        this.write_position = value > this.write_position ? value : this.write_position;
	    }
	    reset() {
	        this.clear();
	    }
	    /**
	     * ByteArray 对象的长度（以字节为单位）。
	     * 如果将长度设置为大于当前长度的值，则用零填充字节数组的右侧。
	     * 如果将长度设置为小于当前长度的值，将会截断该字节数组。
	     * @member {number} ByteArray#length
	     */
	    get length() {
	        return this.write_position;
	    }
	    set length(value) {
	        this.validateBuffer(value, true);
	    }
	    /**
	     * 可从字节数组的当前位置到数组末尾读取的数据的字节数。
	     * 每次访问 ByteArray 对象时，将 bytesAvailable 属性与读取方法结合使用，以确保读取有效的数据。
	     * @member {number} ByteArray#bytesAvailable
	     */
	    get bytesAvailable() {
	        return this.data.byteLength - this._position;
	    }
	    /**
	     * 清除字节数组的内容，并将 length 和 position 属性重置为 0。
	     * @method ByteArray#clear
	     */
	    clear() {
	        this._setArrayBuffer(new ArrayBuffer(this.BUFFER_EXT_SIZE));
	    }
	    //public getArray():Uint8Array {
	    //    if (this.array == null) {
	    //        this.array = new Uint8Array(this.data.buffer, this.data.byteOffset, this.data.byteLength);
	    //    }
	    //    return this.array;
	    //}
	    /**
	     * 从字节流中读取布尔值。读取单个字节，如果字节非零，则返回 true，否则返回 false
	     * @return 如果字节不为零，则返回 true，否则返回 false
	     * @method ByteArray#readBoolean
	     */
	    readBoolean() {
	        //if (!this.validate(ByteArray.SIZE_OF_BOOLEAN)) return null;
	        return this.data.getUint8(this.position++) != 0;
	    }
	    /**
	     * 从字节流中读取带符号的字节
	     * @return 介于 -128 和 127 之间的整数
	     * @method ByteArray#readByte
	     */
	    readByte() {
	        //if (!this.validate(ByteArray.SIZE_OF_INT8)) return null;
	        return this.data.getInt8(this.position++);
	    }
	    /**
	     * 从字节流中读取 length 参数指定的数据字节数。从 offset 指定的位置开始，将字节读入 bytes 参数指定的 ByteArray 对象中，并将字节写入目标 ByteArray 中
	     * @param bytes 要将数据读入的 ByteArray 对象
	     * @param offset bytes 中的偏移（位置），应从该位置写入读取的数据
	     * @param length 要读取的字节数。默认值 0 导致读取所有可用的数据
	     * @method ByteArray#readBytes
	     */
	    readBytes(bytes, offset = 0, length = 0) {
	        //if (length == 0) {
	        //    length = this.bytesAvailable;
	        //}
	        //else if (!this.validate(length)) {
	        //    return null;
	        //}
	        //if (bytes) {
	        //    bytes.validateBuffer(length);
	        //}
	        //else {
	        //    bytes = new ByteArray(new ArrayBuffer(length));
	        //}
	        //This method is expensive
	        for (var i = 0; i < length; i++) {
	            bytes.data.setUint8(i + offset, this.data.getUint8(this.position++));
	        }
	    }
	    //public get leftBytes():ArrayBuffer {
	    //    var begin = this.data.byteOffset + this.position;
	    //    var end = this.data.byteLength;
	    //    var result = new ArrayBuffer(end - begin);
	    //    var resultBytes = new Uint8Array(result);
	    //    var sourceBytes = new Uint8Array(this.data.buffer, begin, end - begin);
	    //    resultBytes.set(sourceBytes);
	    //    return resultBytes.buffer;
	    //}
	    /**
	     * 从字节流中读取一个 IEEE 754 双精度（64 位）浮点数
	     * @return 双精度（64 位）浮点数
	     * @method ByteArray#readDouble
	     */
	    readDouble() {
	        //if (!this.validate(ByteArray.SIZE_OF_FLOAT64)) return null;
	        var value = this.data.getFloat64(this.position, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_FLOAT64;
	        return value;
	    }
	    /**
	     * 从字节流中读取一个 IEEE 754 单精度（32 位）浮点数
	     * @return 单精度（32 位）浮点数
	     * @method ByteArray#readFloat
	     */
	    readFloat() {
	        //if (!this.validate(ByteArray.SIZE_OF_FLOAT32)) return null;
	        var value = this.data.getFloat32(this.position, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_FLOAT32;
	        return value;
	    }
	    /**
	     * 从字节流中读取一个带符号的 32 位整数
	     * @return 介于 -2147483648 和 2147483647 之间的 32 位带符号整数
	     * @method ByteArray#readFloat
	     */
	    readInt() {
	        //if (!this.validate(ByteArray.SIZE_OF_INT32)) return null;
	        var value = this.data.getInt32(this.position, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_INT32;
	        return value;
	    }
	    getInt() {
	        var value = this.data.getInt32(this.position, this.endian == Endian.LITTLE_ENDIAN);
	        return value;
	    }
	    readInt32() {
	        return this.readInt();
	    }
	    //        public readInt64():Int64{
	    //            if (!this.validate(ByteArray.SIZE_OF_UINT32)) return null;
	    //
	    //            var low = this.data.getInt32(this.position, this.endian == Endian.LITTLE_ENDIAN);
	    //            this.position += ByteArray.SIZE_OF_INT32;
	    //            var high = this.data.getInt32(this.position, this.endian == Endian.LITTLE_ENDIAN);
	    //            this.position += ByteArray.SIZE_OF_INT32;
	    //            return new Int64(low,high);
	    //        }
	    /**
	     * 使用指定的字符集从字节流中读取指定长度的多字节字符串
	     * @param length 要从字节流中读取的字节数
	     * @param charSet 表示用于解释字节的字符集的字符串。可能的字符集字符串包括 "shift-jis"、"cn-gb"、"iso-8859-1"”等
	     * @return UTF-8 编码的字符串
	     * @method ByteArray#readMultiByte
	     */
	    //public readMultiByte(length:number, charSet?:string):string {
	    //    if (!this.validate(length)) return null;
	    //
	    //    return "";
	    //}
	    /**
	     * 从字节流中读取一个带符号的 16 位整数
	     * @return 介于 -32768 和 32767 之间的 16 位带符号整数
	     * @method ByteArray#readShort
	     */
	    readShort() {
	        //if (!this.validate(ByteArray.SIZE_OF_INT16)) return null;
	        if (this.position >= this.data.byteLength) ;
	        var value = this.data.getInt16(this.position, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_INT16;
	        return value;
	    }
	    //自己添加的读无符号短整行2个字节 Pan
	    readFloatTwoByte($scaleNum) {
	        return this.readShort() / $scaleNum;
	        // return (this.readByte() * 127 + this.readByte()) / $scaleNum
	    }
	    //自己添加的读无符号短整行1个字节 lyf
	    readFloatOneByte() {
	        return (this.readByte() + 128) / 256;
	    }
	    /**
	     * 从字节流中读取无符号的字节
	     * @return 介于 0 和 255 之间的 32 位无符号整数
	     * @method ByteArray#readUnsignedByte
	     */
	    readUnsignedByte() {
	        //if (!this.validate(ByteArray.SIZE_OF_UINT8)) return null;
	        return this.data.getUint8(this.position++);
	    }
	    readUint8() {
	        return this.readUnsignedByte();
	    }
	    readInt8() {
	        return this.readByte();
	    }
	    /**
	     * 从字节流中读取一个无符号的 32 位整数
	     * @return 介于 0 和 4294967295 之间的 32 位无符号整数
	     * @method ByteArray#readUnsignedInt
	     */
	    readUnsignedInt() {
	        //if (!this.validate(ByteArray.SIZE_OF_UINT32)) return null;
	        var value = this.data.getUint32(this.position, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_UINT32;
	        return value;
	    }
	    readUint32() {
	        return this.readUnsignedInt();
	    }
	    readUint64() {
	        return this.readDouble();
	    }
	    //public readVariableSizedUnsignedInt():number {
	    //    var i:number;
	    //    var c:number = this.data.getUint8(this.position++);
	    //    if (c != 0xFF) {
	    //        i = c << 8;
	    //        c = this.data.getUint8(this.position++);
	    //        i |= c;
	    //    }
	    //    else {
	    //        c = this.data.getUint8(this.position++);
	    //        i = c << 16;
	    //        c = this.data.getUint8(this.position++);
	    //        i |= c << 8;
	    //        c = this.data.getUint8(this.position++);
	    //        i |= c;
	    //    }
	    //    return i;
	    //}
	    //		public readUnsignedInt64():UInt64{
	    //            if (!this.validate(ByteArray.SIZE_OF_UINT32)) return null;
	    //
	    //            var low = this.data.getUint32(this.position, this.endian == Endian.LITTLE_ENDIAN);
	    //            this.position += ByteArray.SIZE_OF_UINT32;
	    //            var high = this.data.getUint32(this.position, this.endian == Endian.LITTLE_ENDIAN);
	    //            this.position += ByteArray.SIZE_OF_UINT32;
	    //			return new UInt64(low,high);
	    //        }
	    /**
	     * 从字节流中读取一个无符号的 16 位整数
	     * @return 介于 0 和 65535 之间的 16 位无符号整数
	     * @method ByteArray#readUnsignedShort
	     */
	    readUnsignedShort() {
	        //if (!this.validate(ByteArray.SIZE_OF_UINT16)) return null;
	        var value = this.data.getUint16(this.position, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_UINT16;
	        return value;
	    }
	    readUint16() {
	        return this.readUnsignedShort();
	    }
	    /**
	     * 从字节流中读取一个 UTF-8 字符串。假定字符串的前缀是无符号的短整型（以字节表示长度）
	     * @return UTF-8 编码的字符串
	     * @method ByteArray#readUTF
	     */
	    readUTF() {
	        //if (!this.validate(ByteArray.SIZE_OF_UINT16)) return null;
	        var length = this.data.getUint16(this.position, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_UINT16;
	        if (length > 0) {
	            return this.readUTFBytes(length);
	        }
	        else {
	            return "";
	        }
	    }
	    readString() {
	        return this.readUTF();
	    }
	    /**
	     * 从字节流中读取一个由 length 参数指定的 UTF-8 字节序列，并返回一个字符串
	     * @param length 指明 UTF-8 字节长度的无符号短整型数
	     * @return 由指定长度的 UTF-8 字节组成的字符串
	     * @method ByteArray#readUTFBytes
	     */
	    readUTFBytes(length) {
	        //if (!this.validate(length)) return null;
	        var bytes = new Uint8Array(this.buffer, this.bufferOffset + this.position, length);
	        this.position += length;
	        /*var bytes: Uint8Array = new Uint8Array(new ArrayBuffer(length));
	         for (var i = 0; i < length; i++) {
	         bytes[i] = this.data.getUint8(this.position++);
	         }*/
	        return this.decodeUTF8(bytes);
	    }
	    readStringByLen(len) {
	        return this.readUTFBytes(len);
	    }
	    //public readStandardString(length:number):string {
	    //    if (!this.validate(length)) return null;
	    //
	    //    var str:string = "";
	    //
	    //    for (var i = 0; i < length; i++) {
	    //        str += String.fromCharCode(this.data.getUint8(this.position++));
	    //    }
	    //    return str;
	    //}
	    //public readStringTillNull(keepEvenByte:boolean = true):string {
	    //
	    //    var str:string = "";
	    //    var num:number = 0;
	    //    while (this.bytesAvailable > 0) {
	    //        var b:number = this.data.getUint8(this.position++);
	    //        num++;
	    //        if (b != 0) {
	    //            str += String.fromCharCode(b);
	    //        } else {
	    //            if (keepEvenByte && num % 2 != 0) {
	    //                this.position++;
	    //            }
	    //            break;
	    //        }
	    //    }
	    //    return str;
	    //}
	    /**
	     * 写入布尔值。根据 value 参数写入单个字节。如果为 true，则写入 1，如果为 false，则写入 0
	     * @param value 确定写入哪个字节的布尔值。如果该参数为 true，则该方法写入 1；如果该参数为 false，则该方法写入 0
	     * @method ByteArray#writeBoolean
	     */
	    writeBoolean(value) {
	        this.validateBuffer(Pan3dByteArray.SIZE_OF_BOOLEAN);
	        this.data.setUint8(this.position++, value ? 1 : 0);
	    }
	    /**
	     * 在字节流中写入一个字节
	     * 使用参数的低 8 位。忽略高 24 位
	     * @param value 一个 32 位整数。低 8 位将被写入字节流
	     * @method ByteArray#writeByte
	     */
	    writeByte(value) {
	        this.validateBuffer(Pan3dByteArray.SIZE_OF_INT8);
	        this.data.setInt8(this.position++, value);
	    }
	    writeUint8(value) {
	        this.writeByte(value);
	    }
	    writeInt8(value) {
	        this.writeByte(value);
	    }
	    //public writeUnsignedByte(value:number):void {
	    //    this.validateBuffer(ByteArray.SIZE_OF_UINT8);
	    //
	    //    this.data.setUint8(this.position++, value);
	    //}
	    /**
	     * 将指定字节数组 bytes（起始偏移量为 offset，从零开始的索引）中包含 length 个字节的字节序列写入字节流
	     * 如果省略 length 参数，则使用默认长度 0；该方法将从 offset 开始写入整个缓冲区。如果还省略了 offset 参数，则写入整个缓冲区
	     * 如果 offset 或 length 超出范围，它们将被锁定到 bytes 数组的开头和结尾
	     * @param bytes ByteArray 对象
	     * @param offset 从 0 开始的索引，表示在数组中开始写入的位置
	     * @param length 一个无符号整数，表示在缓冲区中的写入范围
	     * @method ByteArray#writeBytes
	     */
	    writeBytes(bytes, offset = 0, length = 0) {
	        var writeLength;
	        if (offset < 0) {
	            return;
	        }
	        if (length < 0) {
	            return;
	        }
	        else if (length == 0) {
	            writeLength = bytes.length - offset;
	        }
	        else {
	            writeLength = Math.min(bytes.length - offset, length);
	        }
	        if (writeLength > 0) {
	            this.validateBuffer(writeLength);
	            var tmp_data = new DataView(bytes.buffer);
	            for (var i = offset; i < writeLength + offset; i++) {
	                this.data.setUint8(this.position++, tmp_data.getUint8(i));
	            }
	        }
	    }
	    /**
	     * 在字节流中写入一个 IEEE 754 双精度（64 位）浮点数
	     * @param value 双精度（64 位）浮点数
	     * @method ByteArray#writeDouble
	     */
	    writeDouble(value) {
	        this.validateBuffer(Pan3dByteArray.SIZE_OF_FLOAT64);
	        this.data.setFloat64(this.position, value, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_FLOAT64;
	    }
	    /**
	     * 在字节流中写入一个 IEEE 754 单精度（32 位）浮点数
	     * @param value 单精度（32 位）浮点数
	     * @method ByteArray#writeFloat
	     */
	    writeFloat(value) {
	        this.validateBuffer(Pan3dByteArray.SIZE_OF_FLOAT32);
	        this.data.setFloat32(this.position, value, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_FLOAT32;
	    }
	    /**
	     * 在字节流中写入一个带符号的 32 位整数
	     * @param value 要写入字节流的整数
	     * @method ByteArray#writeInt
	     */
	    writeInt(value) {
	        this.validateBuffer(Pan3dByteArray.SIZE_OF_INT32);
	        this.data.setInt32(this.position, value, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_INT32;
	    }
	    writeInt32(value) {
	        this.writeInt(value);
	    }
	    /**
	     * 使用指定的字符集将多字节字符串写入字节流
	     * @param value 要写入的字符串值
	     * @param charSet 表示要使用的字符集的字符串。可能的字符集字符串包括 "shift-jis"、"cn-gb"、"iso-8859-1"”等
	     * @method ByteArray#writeMultiByte
	     */
	    //public writeMultiByte(value:string, charSet:string):void {
	    //
	    //}
	    /**
	     * 在字节流中写入一个 16 位整数。使用参数的低 16 位。忽略高 16 位
	     * @param value 32 位整数，该整数的低 16 位将被写入字节流
	     * @method ByteArray#writeShort
	     */
	    writeUnsignedShort(value) {
	        this.validateBuffer(Pan3dByteArray.SIZE_OF_INT16);
	        this.data.setInt16(this.position, value, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_INT16;
	    }
	    writeUint16(value) {
	        this.writeUnsignedShort(value);
	    }
	    writeUint64(value) {
	        this.validateBuffer(Pan3dByteArray.SIZE_OF_FLOAT64);
	        this.data.setFloat64(this.position, value, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_FLOAT64;
	    }
	    writeShort(value) {
	        this.validateBuffer(Pan3dByteArray.SIZE_OF_INT16);
	        this.data.setUint16(this.position, value, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_INT16;
	    }
	    //public writeUnsignedShort(value:number):void {
	    //    this.validateBuffer(ByteArray.SIZE_OF_UINT16);
	    //
	    //    this.data.setUint16(this.position, value, this.endian == Endian.LITTLE_ENDIAN);
	    //    this.position += ByteArray.SIZE_OF_UINT16;
	    //}
	    /**
	     * 在字节流中写入一个无符号的 32 位整数
	     * @param value 要写入字节流的无符号整数
	     * @method ByteArray#writeUnsignedInt
	     */
	    writeUnsignedInt(value) {
	        this.validateBuffer(Pan3dByteArray.SIZE_OF_UINT32);
	        this.data.setUint32(this.position, value, this.endian == Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_UINT32;
	    }
	    writeUint32(value) {
	        this.writeUnsignedInt(value);
	    }
	    /**
	     * 将 UTF-8 字符串写入字节流。先写入以字节表示的 UTF-8 字符串长度（作为 16 位整数），然后写入表示字符串字符的字节
	     * @param value 要写入的字符串值
	     * @method ByteArray#writeUTF
	     */
	    writeUTF(value) {
	        var utf8bytes = this.encodeUTF8(value);
	        var length = utf8bytes.length;
	        this.validateBuffer(Pan3dByteArray.SIZE_OF_UINT16 + length);
	        this.data.setUint16(this.position, length, this.endian === Endian.LITTLE_ENDIAN);
	        this.position += Pan3dByteArray.SIZE_OF_UINT16;
	        this._writeUint8Array(utf8bytes, false);
	    }
	    writeString(value) {
	        var strByteArray = new Pan3dByteArray();
	        strByteArray.writeUTFBytes(value);
	        this.writeUint16(strByteArray.length + 1); //标识字符数量
	        this.writeBytes(strByteArray, 0, strByteArray.length);
	        this.writeByte(0);
	    }
	    writeStringByLen(value, len) {
	        var curPos = this.position;
	        this.writeUTFBytes(value);
	        this.position = curPos + len;
	        this.length = this.position + 1;
	    }
	    readVector3D($w = false) {
	        var $p = new Vector3D;
	        $p.x = this.readFloat();
	        $p.y = this.readFloat();
	        $p.z = this.readFloat();
	        if ($w) {
	            $p.w = this.readFloat();
	        }
	        return $p;
	    }
	    /**
	     * 将 UTF-8 字符串写入字节流。类似于 writeUTF() 方法，但 writeUTFBytes() 不使用 16 位长度的词为字符串添加前缀
	     * @param value 要写入的字符串值
	     * @method ByteArray#writeUTFBytes
	     */
	    writeUTFBytes(value) {
	        this._writeUint8Array(this.encodeUTF8(value));
	    }
	    toString() {
	        return "[ByteArray] length:" + this.length + ", bytesAvailable:" + this.bytesAvailable;
	    }
	    /**
	     * 将 Uint8Array 写入字节流
	     * @param bytes 要写入的Uint8Array
	     * @param validateBuffer
	     */
	    _writeUint8Array(bytes, validateBuffer = true) {
	        if (validateBuffer) {
	            this.validateBuffer(this.position + bytes.length);
	        }
	        for (var i = 0; i < bytes.length; i++) {
	            this.data.setUint8(this.position++, bytes[i]);
	        }
	    }
	    /**
	     * @private
	     */
	    validate(len) {
	        //len += this.data.byteOffset;
	        if (this.data.byteLength > 0 && this._position + len <= this.data.byteLength) {
	            return true;
	        }
	    }
	    /**********************/
	    /*  PRIVATE METHODS   */
	    /**********************/
	    validateBuffer(len, needReplace = false) {
	        this.write_position = len > this.write_position ? len : this.write_position;
	        len += this._position;
	        if (this.data.byteLength < len || needReplace) {
	            var tmp = new Uint8Array(new ArrayBuffer(len + this.BUFFER_EXT_SIZE));
	            var length = Math.min(this.data.buffer.byteLength, len + this.BUFFER_EXT_SIZE);
	            tmp.set(new Uint8Array(this.data.buffer, 0, length));
	            this.buffer = tmp.buffer;
	        }
	    }
	    /**
	     * UTF-8 Encoding/Decoding
	     */
	    encodeUTF8(str) {
	        var pos = 0;
	        var codePoints = this.stringToCodePoints(str);
	        var outputBytes = [];
	        while (codePoints.length > pos) {
	            var code_point = codePoints[pos++];
	            if (this.inRange(code_point, 0xD800, 0xDFFF)) {
	                this.encoderError(code_point);
	            }
	            else if (this.inRange(code_point, 0x0000, 0x007f)) {
	                outputBytes.push(code_point);
	            }
	            else {
	                var count, offset;
	                if (this.inRange(code_point, 0x0080, 0x07FF)) {
	                    count = 1;
	                    offset = 0xC0;
	                }
	                else if (this.inRange(code_point, 0x0800, 0xFFFF)) {
	                    count = 2;
	                    offset = 0xE0;
	                }
	                else if (this.inRange(code_point, 0x10000, 0x10FFFF)) {
	                    count = 3;
	                    offset = 0xF0;
	                }
	                outputBytes.push(this.div(code_point, Math.pow(64, count)) + offset);
	                while (count > 0) {
	                    var temp = this.div(code_point, Math.pow(64, count - 1));
	                    outputBytes.push(0x80 + (temp % 64));
	                    count -= 1;
	                }
	            }
	        }
	        return new Uint8Array(outputBytes);
	    }
	    decodeUTF8(data) {
	        var fatal = false;
	        var pos = 0;
	        var result = "";
	        var code_point;
	        var utf8_code_point = 0;
	        var utf8_bytes_needed = 0;
	        var utf8_bytes_seen = 0;
	        var utf8_lower_boundary = 0;
	        while (data.length > pos) {
	            var _byte = data[pos++];
	            if (_byte === this.EOF_byte) {
	                if (utf8_bytes_needed !== 0) {
	                    code_point = this.decoderError(fatal);
	                }
	                else {
	                    code_point = this.EOF_code_point;
	                }
	            }
	            else {
	                if (utf8_bytes_needed === 0) {
	                    if (this.inRange(_byte, 0x00, 0x7F)) {
	                        code_point = _byte;
	                    }
	                    else {
	                        if (this.inRange(_byte, 0xC2, 0xDF)) {
	                            utf8_bytes_needed = 1;
	                            utf8_lower_boundary = 0x80;
	                            utf8_code_point = _byte - 0xC0;
	                        }
	                        else if (this.inRange(_byte, 0xE0, 0xEF)) {
	                            utf8_bytes_needed = 2;
	                            utf8_lower_boundary = 0x800;
	                            utf8_code_point = _byte - 0xE0;
	                        }
	                        else if (this.inRange(_byte, 0xF0, 0xF4)) {
	                            utf8_bytes_needed = 3;
	                            utf8_lower_boundary = 0x10000;
	                            utf8_code_point = _byte - 0xF0;
	                        }
	                        else {
	                            this.decoderError(fatal);
	                        }
	                        utf8_code_point = utf8_code_point * Math.pow(64, utf8_bytes_needed);
	                        code_point = null;
	                    }
	                }
	                else if (!this.inRange(_byte, 0x80, 0xBF)) {
	                    utf8_code_point = 0;
	                    utf8_bytes_needed = 0;
	                    utf8_bytes_seen = 0;
	                    utf8_lower_boundary = 0;
	                    pos--;
	                    code_point = this.decoderError(fatal, _byte);
	                }
	                else {
	                    utf8_bytes_seen += 1;
	                    utf8_code_point = utf8_code_point + (_byte - 0x80) * Math.pow(64, utf8_bytes_needed - utf8_bytes_seen);
	                    if (utf8_bytes_seen !== utf8_bytes_needed) {
	                        code_point = null;
	                    }
	                    else {
	                        var cp = utf8_code_point;
	                        var lower_boundary = utf8_lower_boundary;
	                        utf8_code_point = 0;
	                        utf8_bytes_needed = 0;
	                        utf8_bytes_seen = 0;
	                        utf8_lower_boundary = 0;
	                        if (this.inRange(cp, lower_boundary, 0x10FFFF) && !this.inRange(cp, 0xD800, 0xDFFF)) {
	                            code_point = cp;
	                        }
	                        else {
	                            code_point = this.decoderError(fatal, _byte);
	                        }
	                    }
	                }
	            }
	            //Decode string
	            if (code_point !== null && code_point !== this.EOF_code_point) {
	                if (code_point <= 0xFFFF) {
	                    if (code_point > 0)
	                        result += String.fromCharCode(code_point);
	                }
	                else {
	                    code_point -= 0x10000;
	                    result += String.fromCharCode(0xD800 + ((code_point >> 10) & 0x3ff));
	                    result += String.fromCharCode(0xDC00 + (code_point & 0x3ff));
	                }
	            }
	        }
	        return result;
	    }
	    encoderError(code_point) {
	        //$error(1026, code_point);
	    }
	    decoderError(fatal, opt_code_point) {
	        return opt_code_point || 0xFFFD;
	    }
	    inRange(a, min, max) {
	        return min <= a && a <= max;
	    }
	    div(n, d) {
	        return Math.floor(n / d);
	    }
	    stringToCodePoints(string) {
	        /** @type {Array.<number>} */
	        var cps = [];
	        // Based on http://www.w3.org/TR/WebIDL/#idl-DOMString
	        var i = 0, n = string.length;
	        while (i < string.length) {
	            var c = string.charCodeAt(i);
	            if (!this.inRange(c, 0xD800, 0xDFFF)) {
	                cps.push(c);
	            }
	            else if (this.inRange(c, 0xDC00, 0xDFFF)) {
	                cps.push(0xFFFD);
	            }
	            else { // (inRange(c, 0xD800, 0xDBFF))
	                if (i === n - 1) {
	                    cps.push(0xFFFD);
	                }
	                else {
	                    var d = string.charCodeAt(i + 1);
	                    if (this.inRange(d, 0xDC00, 0xDFFF)) {
	                        var a = c & 0x3FF;
	                        var b = d & 0x3FF;
	                        i += 1;
	                        cps.push(0x10000 + (a << 10) + b);
	                    }
	                    else {
	                        cps.push(0xFFFD);
	                    }
	                }
	            }
	            i += 1;
	        }
	        return cps;
	    }
	}
	Pan3dByteArray.SIZE_OF_BOOLEAN = 1;
	Pan3dByteArray.SIZE_OF_INT8 = 1;
	Pan3dByteArray.SIZE_OF_INT16 = 2;
	Pan3dByteArray.SIZE_OF_INT32 = 4;
	Pan3dByteArray.SIZE_OF_UINT8 = 1;
	Pan3dByteArray.SIZE_OF_UINT16 = 2;
	Pan3dByteArray.SIZE_OF_UINT32 = 4;
	Pan3dByteArray.SIZE_OF_FLOAT32 = 4;
	Pan3dByteArray.SIZE_OF_FLOAT64 = 8;

	class Util {
	    static float2int(value) {
	        return value | 0;
	    }
	    static radian2angle(value) {
	        return value / Math.PI * 180;
	    }
	    static angle2radian(value) {
	        return value / 180 * Math.PI;
	    }
	    /**阿拉伯数字转换成中文数字 */
	    static getChiNum($id) {
	        return Util.keyChi[$id];
	    }
	    static hexToArgb(expColor, is32 = true, color = null) {
	        if (!color) {
	            color = new Vector3D();
	        }
	        color.w = is32 ? (expColor >> 24) & 0xFF : 0;
	        color.x = (expColor >> 16) & 0xFF;
	        color.y = (expColor >> 8) & 0xFF;
	        color.z = (expColor) & 0xFF;
	        return color;
	    }
	    static hexToArgbNum(expColor, is32 = true, color = null) {
	        color = Util.hexToArgb(expColor, is32, color);
	        color.scaleBy(1 / 0xFF);
	        return color;
	    }
	    static getBaseUrl() {
	        if (Scene_data.supportBlob) {
	            return "";
	        }
	        else {
	            return "_base";
	        }
	    }
	    /**描边路径 */
	    static strokeFilter(ctx, width, height, color) {
	        var colorVec = Util.hexToArgb(color);
	        var imgData = ctx.getImageData(0, 0, width, height);
	        var data = imgData.data;
	        var targetAry = new Array;
	        for (var i = 1; i < width - 1; i++) {
	            for (var j = 0; j < height - 1; j++) {
	                var idx = getPiexIdx(i, j);
	                if (data[idx + 3] == 0) {
	                    if (getAround(i, j)) {
	                        targetAry.push(idx);
	                    }
	                }
	            }
	        }
	        for (var i = 0; i < targetAry.length; i++) {
	            data[targetAry[i]] = colorVec.x;
	            data[targetAry[i] + 1] = colorVec.y;
	            data[targetAry[i] + 2] = colorVec.z;
	            data[targetAry[i] + 3] = colorVec.w;
	        }
	        ctx.putImageData(imgData, 0, 0);
	        function getPiexIdx(x, y) {
	            return ((y * width) + x) * 4;
	        }
	        function getAround(x, y) {
	            var idx;
	            idx = getPiexIdx(x - 1, y);
	            if (data[idx + 3] > 0) {
	                return true;
	            }
	            idx = getPiexIdx(x + 1, y);
	            if (data[idx + 3] > 0) {
	                return true;
	            }
	            idx = getPiexIdx(x, y + 1);
	            if (data[idx + 3] > 0) {
	                return true;
	            }
	            idx = getPiexIdx(x, y - 1);
	            if (data[idx + 3] > 0) {
	                return true;
	            }
	            // idx = getPiexIdx(x - 1, y+1);
	            // if (data[idx + 3] > 0) {
	            //     return true;
	            // }
	            // idx = getPiexIdx(x + 1, y+1);
	            // if (data[idx + 3] > 0) {
	            //     return true;
	            // }
	            // idx = getPiexIdx(x - 1, y-1);
	            // if (data[idx + 3] > 0) {
	            //     return true;
	            // }
	            // idx = getPiexIdx(x + 1, y-1);
	            // if (data[idx + 3] > 0) {
	            //     return true;
	            // }
	            return false;
	        }
	    }
	    static trim(s) {
	        return Util.trimRight(Util.trimLeft(s));
	    }
	    //去掉左边的空白  
	    static trimLeft(s) {
	        if (s == null) {
	            return "";
	        }
	        var whitespace = new String(" \t\n\r");
	        var str = new String(s);
	        if (whitespace.indexOf(str.charAt(0)) != -1) {
	            var j = 0, i = str.length;
	            while (j < i && whitespace.indexOf(str.charAt(j)) != -1) {
	                j++;
	            }
	            str = str.substring(j, i);
	        }
	        return str;
	    }
	    //去掉右边的空白 www.2cto.com   
	    static trimRight(s) {
	        if (s == null)
	            return "";
	        var whitespace = new String(" \t\n\r");
	        var str = new String(s);
	        if (whitespace.indexOf(str.charAt(str.length - 1)) != -1) {
	            var i = str.length - 1;
	            while (i >= 0 && whitespace.indexOf(str.charAt(i)) != -1) {
	                i--;
	            }
	            str = str.substring(0, i + 1);
	        }
	        return str;
	    }
	    static TweenMoveTo(taget, t, vars) {
	    }
	    static getScencdStr(timeNum) {
	        var m = Math.floor((timeNum / 60 % 60));
	        var s = Math.floor(timeNum % 60);
	        return String(m < 10 ? "0" : "") + String(m) + ":" + String(s < 10 ? "0" : "") + String(s);
	    }
	    //function trace(message?: any, ...optionalParams: any[]): void {
	    //    //console.log(message, ...optionalParams);
	    //}
	    static random($num) {
	        return Math.floor(Math.random() * $num);
	    }
	    static randomByItem(arr) {
	        return arr[Util.random(arr.length)];
	    }
	    static makeArray(a, b) {
	        for (var i = 0; i < a.length; i++) {
	            b.push(a[i]);
	        }
	    }
	    static unZip($aryBuf) {
	        var compressed = new Uint8Array($aryBuf);
	        //var t = Date.now();
	        var inflate = new Zlib.Inflate(compressed);
	        var plain = inflate.decompress();
	        ////console.log("解压obj",Date.now()-t);
	        return plain.buffer;
	    }
	    static getZipByte($byte) {
	        var zipLen = $byte.readInt();
	        var aryBuf = $byte.buffer.slice($byte.position, $byte.position + zipLen);
	        $byte.position += zipLen;
	        var zipedBuf = Util.unZip(aryBuf);
	        return new Pan3dByteArray(zipedBuf);
	    }
	    static getUrlParam(name) {
	        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	        var r = window.location.search.substr(1).match(reg);
	        if (r != null) {
	            return decodeURI(r[2]);
	        }
	        else {
	            return null;
	        }
	    }
	    static copy2clipboard(val) {
	        var inputui = document.createElement("textarea");
	        //inputui.type = "text";
	        inputui.style.fontSize = '12pt';
	        inputui.style.position = "absolute";
	        inputui.style["z-index"] = -1;
	        inputui.style.background = "transparent";
	        inputui.style.border = "transparent";
	        inputui.style.color = "white";
	        inputui.setAttribute('readonly', '');
	        document.body.appendChild(inputui);
	        inputui.value = val;
	        inputui.select();
	        inputui.setSelectionRange(0, inputui.value.length);
	        try {
	            document.execCommand('copy');
	        }
	        catch (error) {
	            alert("不支持复制");
	        }
	        setTimeout(function () {
	            document.body.removeChild(inputui);
	        }, 1000);
	    }
	    static getBit($num, offset) {
	        return (Boolean)($num >> (offset & 31) & 1);
	    }
	}
	Util.keyChi = [
	    "零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五"
	];

	class TimeUtil {
	    static getTimer() {
	        return Date.now() - TimeUtil.START_TIME;
	    }
	    static getTimerSecond() {
	        return TimeUtil.getTimer() / 1000;
	    }
	    //标记现在时间
	    static saveNowTime() {
	        this.lastTime = this.getTimer();
	    }
	    //得到使用的时间
	    static getUseTime() {
	        return this.getTimer() - this.lastTime;
	    }
	    static getZeroTime(nS) {
	        var timestamp4 = new Date(nS * 1000);
	        timestamp4.setHours(0);
	        timestamp4.setMinutes(0);
	        timestamp4.setSeconds(0);
	        return timestamp4.getTime() / 1000;
	    }
	    /**
	    * YYYY-mm-DD HH:MM
	    **/
	    static getLocalTime(nS) {
	        var timestamp4 = new Date(nS * 1000); //直接用 new Date(时间戳) 格式转化获得当前时间1-00
	        return timestamp4.toLocaleDateString().replace(/\//g, "-") + " " + timestamp4.toTimeString().substr(0, 5);
	    }
	    /**
	    * YYYY-mm-DD
	    **/
	    static getLocalTime0(nS) {
	        var timestamp4 = new Date(nS * 1000); //直接用 new Date(时间戳) 格式转化获得当前时间1-00
	        return timestamp4.toLocaleDateString().replace(/\//g, "-");
	    }
	    /**
	    * YYYY-mm-DD HH:MM:SS
	    **/
	    static getLocalTime1(nS) {
	        var timestamp4 = new Date(nS * 1000); //直接用 new Date(时间戳) 格式转化获得当前时间1-00
	        return timestamp4.toLocaleDateString().replace(/\//g, "-") + " " + timestamp4.toTimeString().substr(0, 8);
	    }
	    /**
	     * HH:MM:SS
	    **/
	    static getLocalTime2(nS) {
	        // var timestamp4 = new Date(nS * 1000 - 8 * 60 * 60 * 1000);//直接用 new Date(时间戳) 格式转化获得当前时间1-00
	        var timestamp4 = new Date(nS * 1000); //直接用 new Date(时间戳) 格式转化获得当前时间1-00
	        ////console.log("--time=",timestamp4.toTimeString());
	        return timestamp4.toTimeString().substr(0, 8);
	    }
	    /**
	     * HH:MM
	    **/
	    static getLocalTime6(nS) {
	        // var timestamp4 = new Date(nS * 1000 - 8 * 60 * 60 * 1000);//直接用 new Date(时间戳) 格式转化获得当前时间1-00
	        var timestamp4 = new Date(nS * 1000); //直接用 new Date(时间戳) 格式转化获得当前时间1-00
	        //console.log("--time=",timestamp4.toTimeString());
	        return timestamp4.toTimeString().substr(0, 5);
	    }
	    /**
	     * MM:SS
	    **/
	    static getLocalTime3(nS) {
	        var timestamp4 = new Date(nS * 1000); //直接用 new Date(时间戳) 格式转化获得当前时间1-00
	        return timestamp4.toTimeString().substr(3, 5);
	    }
	    /**
	     * MM分SS秒
	     */
	    static getLocalTime4(nS) {
	        return Util.float2int(nS / 60) + "分" + (nS % 60) + "秒";
	    }
	    /**
	     * HH时MM分SS秒
	     */
	    static getLocalTime5(nS) {
	        var timestamp4 = new Date(nS * 1000);
	        var str = timestamp4.toTimeString().substr(0, 8);
	        var strAry = str.split(":");
	        return strAry[0] + "时" + strAry[1] + "分" + strAry[2] + "秒";
	    }
	    /**
	     * 时间差转换
	     * DD天HH时MM分SS秒
	     */
	    static getDiffTime1(nS) {
	        var day = Util.float2int(nS / this.dayTime);
	        nS -= day * this.dayTime;
	        var hour = Util.float2int(nS / this.HourTime);
	        nS -= hour * this.HourTime;
	        var minus = Util.float2int(nS / this.MinuteTime);
	        nS -= minus * this.MinuteTime;
	        return day + "天" + hour + "时" + minus + "分" + nS + "秒";
	    }
	    /**
	     * HH:MM:SS
	    **/
	    static getDiffTime2(nS) {
	        var hour = Util.float2int(nS / this.HourTime);
	        nS -= hour * this.HourTime;
	        var minus = Util.float2int(nS / this.MinuteTime);
	        nS -= minus * this.MinuteTime;
	        return this.zeroStr(hour) + ":" + this.zeroStr(minus) + ":" + this.zeroStr(nS);
	    }
	    static zeroStr(num) {
	        if (num > 9) {
	            return String(num);
	        }
	        else {
	            return "0" + num;
	        }
	    }
	    static getDelayTimeStr($hourtime) {
	        var hourtime = Math.floor($hourtime / 3600);
	        var timeStr = "";
	        if (hourtime > 24) {
	            timeStr = Math.floor(hourtime / 24) + "天前";
	        }
	        else {
	            if (hourtime >= 1) {
	                timeStr = hourtime + "小时前";
	            }
	            else {
	                timeStr = "刚刚";
	            }
	        }
	        return timeStr;
	    }
	    static compareTime($hour, $min) {
	        //服务器当前标准时间
	        return false;
	    }
	    static init() {
	        TimeUtil.START_TIME = Date.now();
	    }
	    static addTimeTick($time, $fun, $beginTime = 0) {
	        var timeFunTick = new TimeFunTick();
	        timeFunTick.alltime = $time;
	        timeFunTick.fun = $fun;
	        timeFunTick.time = $time - $beginTime;
	        TimeUtil.timefunAry.push(timeFunTick);
	    }
	    static removeTimeTick($fun) {
	        for (var i = 0; i < TimeUtil.timefunAry.length; i++) {
	            if (TimeUtil.timefunAry[i]) {
	                if (TimeUtil.timefunAry[i].fun == $fun) {
	                    //TimeUtil.timefunAry.splice(i, 1);
	                    TimeUtil.timefunAry[i] = null;
	                    break;
	                }
	            }
	        }
	    }
	    static addTimeOut($time, $fun) {
	        if (this.hasTimeOut($fun)) {
	            return;
	        }
	        var timeFunTick = new TimeFunOut();
	        timeFunTick.alltime = $time;
	        timeFunTick.fun = $fun;
	        timeFunTick.time = 0;
	        TimeUtil.outTimeFunAry.push(timeFunTick);
	    }
	    static removeTimeOut($fun) {
	        for (var i = 0; i < TimeUtil.outTimeFunAry.length; i++) {
	            if (TimeUtil.outTimeFunAry[i] && TimeUtil.outTimeFunAry[i].fun == $fun) {
	                //TimeUtil.outTimeFunAry.splice(i, 1);
	                TimeUtil.outTimeFunAry[i] = null;
	                break;
	            }
	        }
	    }
	    static hasTimeOut($fun) {
	        for (var i = 0; i < TimeUtil.outTimeFunAry.length; i++) {
	            if (TimeUtil.outTimeFunAry[i] && TimeUtil.outTimeFunAry[i].fun == $fun) {
	                return true;
	            }
	        }
	        return false;
	    }
	    static addFrameTick($fun) {
	        if (TimeUtil.funAry.indexOf($fun) == -1) {
	            TimeUtil.funAry.push($fun);
	        }
	    }
	    static hasFrameTick($fun) {
	        var index = TimeUtil.funAry.indexOf($fun);
	        if (index != -1) {
	            return true;
	        }
	        return false;
	    }
	    static removeFrameTick($fun) {
	        var index = TimeUtil.funAry.indexOf($fun);
	        if (index != -1) {
	            TimeUtil.funAry[index] = null;
	            //TimeUtil.funAry.splice(index, 1);
	        }
	    }
	    static update() {
	        var dtime = TimeUtil.getTimer() - TimeUtil.time;
	        for (var i = 0; i < TimeUtil.funAry.length; i++) {
	            if (TimeUtil.funAry[i]) {
	                TimeUtil.funAry[i](dtime);
	            }
	        }
	        for (var i = 0; i < TimeUtil.timefunAry.length; i++) {
	            if (TimeUtil.timefunAry[i]) {
	                TimeUtil.timefunAry[i].update(dtime);
	            }
	        }
	        for (var i = TimeUtil.outTimeFunAry.length - 1; i >= 0; i--) {
	            if (TimeUtil.outTimeFunAry[i] && TimeUtil.outTimeFunAry[i].update(dtime)) {
	                TimeUtil.outTimeFunAry[i] = null;
	            }
	        }
	        for (var i = TimeUtil.funAry.length - 1; i >= 0; i--) {
	            if (!TimeUtil.funAry[i]) {
	                TimeUtil.funAry.splice(i, 1);
	            }
	        }
	        for (var i = TimeUtil.timefunAry.length - 1; i >= 0; i--) {
	            if (!TimeUtil.timefunAry[i]) {
	                TimeUtil.timefunAry.splice(i, 1);
	            }
	        }
	        for (var i = TimeUtil.outTimeFunAry.length - 1; i >= 0; i--) {
	            if (!TimeUtil.outTimeFunAry[i]) {
	                TimeUtil.outTimeFunAry.splice(i, 1);
	            }
	        }
	        TimeUtil.time = TimeUtil.getTimer();
	    }
	}
	TimeUtil.funAry = new Array;
	TimeUtil.timefunAry = new Array;
	TimeUtil.outTimeFunAry = new Array;
	TimeUtil.time = 0;
	TimeUtil.lastTime = 0;
	TimeUtil.dayTime = 24 * 60 * 60;
	TimeUtil.HourTime = 60 * 60;
	TimeUtil.MinuteTime = 60;
	class TimeFunTick {
	    constructor() {
	        this.alltime = 0;
	        this.time = 0;
	    }
	    update(t) {
	        this.time += t;
	        if (this.time >= this.alltime) {
	            this.fun();
	            this.time = 0;
	        }
	    }
	}
	class TimeFunOut {
	    constructor() {
	        this.alltime = 0;
	        this.time = 0;
	    }
	    update(t) {
	        this.time += t;
	        if (this.time >= this.alltime) {
	            this.fun();
	            return true;
	        }
	        return false;
	    }
	}

	class Engine {
	    static init($caves) {
	        /*      var isIpad = /ipad/i.test(navigator.userAgent);
	             var isIphone = /iPhone/i.test(navigator.userAgent);
	             var isAndroid = /android/i.test(navigator.userAgent);
	             var isWindow = /iindow/i.test(navigator.userAgent);
	     
	             var sUserAgent = navigator.userAgent.toLowerCase();
	             ////console.log("--sUserAgent--",sUserAgent,isIpad,isIphone,isAndroid,isWindow);
	             if (isIpad || isIphone || isAndroid) {
	                 Scene_data.isPc = false;
	             } else {
	                 Scene_data.isPc = true;
	             }
	     
	             if (isIpad || isIphone) {
	                 Scene_data.isIos = true;
	             } else {
	                 Scene_data.isIos = false;
	             }
	     
	             Scene_data.vpMatrix = new Matrix3D;
	             Scene_data.canvas3D = $caves;
	             Scene_data.context3D = new Context3D();
	             Scene_data.context3D.init($caves);
	     
	             Scene_data.cam3D = new Camera3D;
	             Scene_data.focus3D = new Object3D;
	             Scene_data.focus3D.x = 0;
	             Scene_data.focus3D.y = 0;
	             Scene_data.focus3D.z = 0;
	           //  Scene_data.focus3D.rotationY = 135;
	           //  Scene_data.focus3D.rotationX = -45;
	     
	             Scene_data.light = new LightVo();
	     
	             Engine.testBlob();
	     
	             Engine.resetSize();
	     
	             Engine.initShadow();
	     
	             TimeUtil.init();
	     
	             PathManager.init(); */
	    }
	    static resetSize(a = 0, b = 0) {
	        /*        if (Engine.needInputTxt) {
	                   return;
	               }
	               //Scene_data.stageWidth = document.documentElement.clientWidth;
	               //Scene_data.stageHeight = document.documentElement.clientHeight;
	               //var flag: boolean = false;
	       
	               if (document.body.clientWidth > document.body.clientHeight) {
	                   Scene_data.stageWidth = document.body.clientWidth;
	                   Scene_data.stageHeight = document.body.clientHeight;
	                   Scene_data.verticalScene = false;
	               } else {
	                   Scene_data.stageWidth = document.body.clientHeight;
	                   Scene_data.stageHeight = document.body.clientWidth;
	                   Scene_data.verticalScene = true;
	               }
	       
	               // Scene_data.stageWidth = document.body.clientWidth;
	               // Scene_data.stageHeight = document.body.clientHeight;
	               // Scene_data.verticalScene = false;
	       
	               if (!this.needVertical) {
	                   Scene_data.stageWidth = document.body.clientWidth;
	                   Scene_data.stageHeight = document.body.clientHeight;
	                   Scene_data.verticalScene = false;
	               }
	       
	               Scene_data.canvas3D.width = Scene_data.stageWidth;
	               Scene_data.canvas3D.height = Scene_data.stageHeight;
	       
	       
	               Scene_data.context3D.resetSize(Scene_data.stageWidth, Scene_data.stageHeight);
	       
	       
	               this.resetViewMatrx3D()
	       
	               Scene_data.canvas3D.style.position = "absolute";
	               Scene_data.canvas3D.style.left = "0px";
	               Scene_data.canvas3D.style.top = "0px";
	       
	               if (Scene_data.verticalScene) {
	                   Scene_data.canvas3D.style.transform = "matrix(0,1,-1,0," + Scene_data.stageHeight + ",0)";
	                   //Scene_data.canvas3D.style.webkitTransform = "matrix(0,1,-1,0," + Scene_data.stageHeight + ",0)";
	               } else {
	       
	                   Scene_data.canvas3D.style.transform = "matrix(1,0,0,1,0,0)";
	                   //Scene_data.canvas3D.style.webkitTransform = "matrix(0,1,-1,0," + Scene_data.stageHeight + ",0)";
	               }
	       
	               Scene_data.canvas3D.style.transformOrigin = "0px 0px 0px";
	       
	               Scene_data.canvas3D.style.top = "0px"; */
	    }
	    static resetViewMatrx3D() {
	        /*         if (Scene_data.viewMatrx3D) {
	                    Scene_data.viewMatrx3D.identity()
	                } else {
	                    Scene_data.viewMatrx3D = new Matrix3D;
	                }
	                var fovw: number = Scene_data.stageWidth
	                var fovh: number = Scene_data.stageHeight
	                Scene_data.sceneViewHW = Math.max(fovw, fovh)
	        
	                Scene_data.viewMatrx3D.perspectiveFieldOfViewLH(this.sceneCamScale, 1, 50, Scene_data.camFar);
	                Scene_data.viewMatrx3D.appendScale(1 * (Scene_data.sceneViewHW / fovw * 2), fovw / fovh * (Scene_data.sceneViewHW / fovw * 2), 1);
	        
	         */
	    }
	    /* public static update(): void {
	          TimeUtil.update();
	         FpsMc.update();
	     }*/
	    static unload() {
	        //NetManager.getInstance().close();
	    }
	}
	/*  public static resReady(): void {
	     Engine.initPbr();
	 }

	 public static testBlob(): void {

	     //Scene_data.supportBlob = false;
	     //return;

	     try {
	         var blob = new Blob();
	     } catch (e) {
	         Scene_data.supportBlob = false;
	         return;
	     }
	     Scene_data.supportBlob = true;
	 }

	 public static initPbr(): void {
	     if (!Scene_data.pubLut) {
	         TextureManager.getInstance().getTexture(Scene_data.fileRoot + "base/brdf_ltu.jpg", ($texture: TextureRes) => {
	             Scene_data.pubLut = $texture.texture;
	         }, 1);
	     }

	     if (!Scene_data.skyCubeMap) {
	         TextureManager.getInstance().loadCubeTexture(Scene_data.fileRoot + "base/cube/e", ($ary: any) => {
	             Scene_data.skyCubeMap = $ary;
	         })
	     }


	 }

	 public static initShadow(): void {
	     TextureManager.getInstance().getTexture(Scene_data.fileRoot + "base/shadow.png", ($texture: TextureRes) => {
	         Display3dShadow.texture = $texture.texture;
	     });
	 } */
	Engine.needVertical = true;
	Engine.needInputTxt = false; //在输入文本时，将不再可调整大小
	Engine.sceneCamScale = 1.76;

	class GC {
	    destory() {
	    }
	}

	class ResCount extends GC {
	    constructor() {
	        super(...arguments);
	        this._useNum = 0;
	        this.idleTime = 0;
	    }
	    get useNum() {
	        return this._useNum;
	    }
	    set useNum(n) {
	        this._useNum = n;
	        if (this._useNum == 0) {
	            this.idleTime = 0;
	        }
	    }
	    clearUseNum() {
	        this._useNum--;
	        if (this._useNum <= 0) {
	            this.idleTime = ResCount.GCTime;
	        }
	    }
	}
	ResCount.GCTime = 4;

	class Shader3D extends ResCount {
	    constructor() {
	        super();
	        this.fragment = this.getFragmentShaderString();
	    }
	    encode() {
	        this.vertex = this.getVertexShaderString();
	        ////console.log(this.vertex);
	        var gl = Scene_data.context3D.renderContext;
	        this.program = gl.createProgram();
	        this.vShader = gl.createShader(gl.VERTEX_SHADER);
	        this.fShader = gl.createShader(gl.FRAGMENT_SHADER);
	        gl.shaderSource(this.vShader, this.vertex);
	        gl.shaderSource(this.fShader, this.fragment);
	        gl.compileShader(this.vShader);
	        gl.compileShader(this.fShader);
	        gl.attachShader(this.program, this.vShader);
	        gl.attachShader(this.program, this.fShader);
	        this.binLocation(gl);
	        gl.linkProgram(this.program);
	        //Scene_data.context3D.addProgram(this.program);
	        this.localDic = new Object();
	        var info = gl.getProgramInfoLog(this.program);
	        var vInfo = gl.getShaderInfoLog(this.vShader);
	        var fInfo = gl.getShaderInfoLog(this.fShader);
	        if (info != "") {
	            if (vInfo == "" && fInfo == "") {
	                return true;
	            }
	            //console.log("shader error: " + info + "," + vInfo + "," + fInfo);
	            return false;
	        }
	        else {
	            return true;
	        }
	    }
	    getWebGLUniformLocation($name) {
	        var local = this.localDic[$name];
	        if (local) {
	            return local;
	        }
	        else {
	            this.localDic[$name] = Scene_data.context3D.getLocation(this.program, $name);
	            return this.localDic[$name];
	        }
	    }
	    binLocation(gl) {
	    }
	    getVertexShaderString() {
	        return "";
	    }
	    getFragmentShaderString() {
	        return "";
	    }
	    destory() {
	        this.vertex = null;
	        this.fragment = null;
	        this.name = null;
	        this.localDic = null;
	        Scene_data.context3D.deleteShader(this);
	    }
	}

	class MaterialAnimShader extends Shader3D {
	    constructor() {
	        super();
	        this.name = "Material_Anim_shader";
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "pos");
	        $context.bindAttribLocation(this.program, 1, "v2Uv");
	        $context.bindAttribLocation(this.program, 2, "boneID");
	        $context.bindAttribLocation(this.program, 3, "boneWeight");
	        var usePbr = this.paramAry[0];
	        var useNormal = this.paramAry[1];
	        var lightProbe = this.paramAry[4];
	        var directLight = this.paramAry[5];
	        if (usePbr) {
	            $context.bindAttribLocation(this.program, 4, "normal");
	            if (useNormal) {
	                $context.bindAttribLocation(this.program, 5, "tangent");
	                $context.bindAttribLocation(this.program, 6, "bitangent");
	            }
	        }
	        else if (lightProbe || directLight) {
	            $context.bindAttribLocation(this.program, 4, "normal");
	        }
	    }
	    static getMd5M44Str() {
	        var str = "vec4 qdv(vec4 q,vec3 d, vec3 v ){\n" +
	            "vec3 t = 2.0 * cross(q.xyz, v);\n" +
	            "vec3 f = v + q.w * t + cross(q.xyz, t);\n" +
	            "return  vec4(f.x+d.x,f.y+d.y,f.z+d.z,1.0);\n" +
	            " }\n" +
	            "vec4 getQDdata(vec3 vdata){\n" +
	            "vec4 tempnum = qdv(boneQ[int(boneID.x)],boneD[int(boneID.x)],vdata) * boneWeight.x;\n" +
	            "tempnum += qdv(boneQ[int(boneID.y)],boneD[int(boneID.y)],vdata) * boneWeight.y;\n" +
	            "tempnum += qdv(boneQ[int(boneID.z)],boneD[int(boneID.z)],vdata)* boneWeight.z;\n" +
	            "tempnum += qdv(boneQ[int(boneID.w)],boneD[int(boneID.w)],vdata) * boneWeight.w;\n" +
	            "tempnum.x = tempnum.x*-1.0;\n" +
	            "return  tempnum;\n" +
	            " }\n";
	        return str;
	    }
	    static getMd5M44NrmStr() {
	        var str = "vec4 qdvNrm(vec4 q, vec3 v ){\n" +
	            "vec3 t = 2.0 * cross(q.xyz, v);\n" +
	            "vec3 f = v + q.w * t + cross(q.xyz, t);\n" +
	            "return  vec4(f.x,f.y,f.z,1.0);\n" +
	            " }\n" +
	            "vec4 getQDdataNrm(vec3 vdata){\n" +
	            "vec4 tempnum = qdvNrm(boneQ[int(boneID.x)],vdata) * boneWeight.x;\n" +
	            "tempnum += qdvNrm(boneQ[int(boneID.y)],vdata) * boneWeight.y;\n" +
	            "tempnum += qdvNrm(boneQ[int(boneID.z)],vdata)* boneWeight.z;\n" +
	            "tempnum += qdvNrm(boneQ[int(boneID.w)],vdata) * boneWeight.w;\n" +
	            "tempnum.x = tempnum.x*-1.0;\n" +
	            "tempnum.xyz = normalize(tempnum.xyz);\n" +
	            "return  tempnum;\n" +
	            " }\n";
	        return str;
	    }
	    getVertexShaderString() {
	        var usePbr = this.paramAry[0];
	        var useNormal = this.paramAry[1];
	        var hasFresnel = this.paramAry[2];
	        var useDynamicIBL = this.paramAry[3];
	        var lightProbe = this.paramAry[4];
	        var directLight = this.paramAry[5];
	        var noLight = this.paramAry[6];
	        var $str = "attribute vec4 pos;\n" +
	            "attribute vec2 v2Uv;\n" +
	            "attribute vec4 boneID;\n" +
	            "attribute vec4 boneWeight;\n" +
	            "varying vec2 v0;\n" +
	            "uniform vec4 boneQ[54];\n" +
	            "uniform vec3 boneD[54];\n" +
	            //"uniform mat4 viewMatrix3D;\n" +
	            // "uniform mat4 camMatrix3D;\n" +
	            "uniform mat4 vpMatrix3D;\n" +
	            "uniform mat4 posMatrix3D;\n";
	        if (lightProbe) {
	            $str +=
	                "uniform vec3 sh[9];\n" +
	                    "varying vec3 v2;\n";
	        }
	        else if (directLight) {
	            $str +=
	                "uniform vec3 sunDirect;\n" +
	                    "uniform vec3 sunColor;\n" +
	                    "uniform vec3 ambientColor;\n" +
	                    "varying vec3 v2;\n";
	        }
	        else if (noLight) ;
	        else {
	            $str +=
	                "varying vec2 v2;\n";
	        }
	        if (usePbr) {
	            $str +=
	                "attribute vec4 normal;\n" +
	                    "uniform mat4 rotationMatrix3D;\n" +
	                    "varying vec3 v1;\n";
	            if (!useNormal) {
	                $str += "varying vec3 v4;\n";
	            }
	            else {
	                $str += "varying mat3 v4;\n";
	            }
	            if (useNormal) {
	                $str +=
	                    "attribute vec4 tangent;\n" +
	                        "attribute vec4 bitangent;\n";
	            }
	        }
	        else if (lightProbe || directLight) {
	            $str +=
	                "attribute vec4 normal;\n" +
	                    "uniform mat4 rotationMatrix3D;\n";
	        }
	        $str +=
	            MaterialAnimShader.getMd5M44Str() +
	                MaterialAnimShader.getMd5M44NrmStr() +
	                "void main(void){\n" +
	                "v0 = v2Uv;\n" +
	                "vec4 vt0 = getQDdata(vec3(pos.x,pos.y,pos.z));\n" +
	                "vt0.xyz = vt0.xyz*1.0;\n" +
	                "vt0 = posMatrix3D * vt0;\n";
	        if (usePbr) {
	            $str +=
	                "v1 = vec3(vt0.x,vt0.y,vt0.z);\n";
	        }
	        $str +=
	            //"vt0 = camMatrix3D * vt0;\n" +
	            //"vt0 = viewMatrix3D * vt0;\n" +
	            "vt0 = vpMatrix3D * vt0;\n" +
	                "gl_Position = vt0;\n";
	        if (usePbr) {
	            if (!useNormal) {
	                $str +=
	                    //"vt0 = bone[int(boneID.x)] * normal * boneWeight.x;\n" +
	                    //"vt0 += bone[int(boneID.y)] * normal * boneWeight.y;\n" +
	                    //"vt0 += bone[int(boneID.z)] * normal * boneWeight.z;\n" +
	                    //"vt0 += bone[int(boneID.w)] * normal * boneWeight.w;\n" +
	                    "vt0 = getQDdataNrm(vec3(normal.x,normal.y,normal.z));\n" +
	                        "vt0 = rotationMatrix3D * vt0;\n" +
	                        "vt0.xyz = normalize(vt0.xyz);\n" +
	                        "v4 = vec3(vt0.x,vt0.y,vt0.z);\n";
	            }
	            else {
	                $str +=
	                    //"vec4 vt2 = bone[int(boneID.x)] * tangent * boneWeight.x;\n" +
	                    //"vt2 += bone[int(boneID.y)] * tangent * boneWeight.y;\n" +
	                    //"vt2 += bone[int(boneID.z)] * tangent * boneWeight.z;\n" +
	                    //"vt2 += bone[int(boneID.w)] * tangent * boneWeight.w;\n" +
	                    "vec4 vt2 = getQDdataNrm(vec3(tangent.x,tangent.y,tangent.z));\n" +
	                        "vt2 = rotationMatrix3D * vt2;\n" +
	                        "vt2.xyz = normalize(vt2.xyz);\n" +
	                        //"vec4 vt1 = bone[int(boneID.x)] * bitangent * boneWeight.x;\n" +
	                        //"vt1 += bone[int(boneID.y)] * bitangent * boneWeight.y;\n" +
	                        //"vt1 += bone[int(boneID.z)] * bitangent * boneWeight.z;\n" +
	                        //"vt1 += bone[int(boneID.w)] * bitangent * boneWeight.w;\n" +
	                        "vec4 vt1 = getQDdataNrm(vec3(bitangent.x,bitangent.y,bitangent.z));\n" +
	                        "vt1 = rotationMatrix3D * vt1;\n" +
	                        "vt1.xyz = normalize(vt1.xyz);\n" +
	                        //"vt0 = bone[int(boneID.x)] * normal * boneWeight.x;\n" +
	                        //"vt0 += bone[int(boneID.y)] * normal * boneWeight.y;\n" +
	                        //"vt0 += bone[int(boneID.z)] * normal * boneWeight.z;\n" +
	                        //"vt0 += bone[int(boneID.w)] * normal * boneWeight.w;\n" +
	                        "vt0 = getQDdataNrm(vec3(normal.x,normal.y,normal.z));\n" +
	                        "vt0 = rotationMatrix3D * vt0;\n" +
	                        "vt0.xyz = normalize(vt0.xyz);\n" +
	                        "v4 = mat3(vec3(vt2.x,vt2.y,vt2.z),vec3(vt1.x,vt1.y,vt1.z),vec3(vt0.x,vt0.y,vt0.z));\n";
	            }
	        }
	        else if (lightProbe || directLight) {
	            $str +=
	                //"vt0 = bone[int(boneID.x)] * normal * boneWeight.x;\n" +
	                //"vt0 += bone[int(boneID.y)] * normal * boneWeight.y;\n" +
	                //"vt0 += bone[int(boneID.z)] * normal * boneWeight.z;\n" +
	                //"vt0 += bone[int(boneID.w)] * normal * boneWeight.w;\n" +
	                "vt0 = getQDdataNrm(vec3(normal.x,normal.y,normal.z));\n" +
	                    "vt0 = rotationMatrix3D * vt0;\n" +
	                    "vt0.xyz = normalize(vt0.xyz);\n";
	            //"vt0 = vec4(0,1,0,1);\n";
	        }
	        if (lightProbe) {
	            $str +=
	                "vec3 lpb = sh[0] * 0.28209479177387814;\n" +
	                    "lpb += sh[1] * (vt0.y * -0.4886025119029199);\n" +
	                    "lpb += sh[2] * (vt0.z * 0.4886025119029199);\n" +
	                    "lpb += sh[3] * (vt0.x * -0.4886025119029199);\n" +
	                    "lpb += sh[4] * (vt0.x * vt0.y * 1.0925484305920792);\n" +
	                    "lpb += sh[5] * (vt0.z * vt0.y * -1.0925484305920792);\n" +
	                    "lpb += sh[6] * ((3.0 * vt0.z * vt0.z - 1.0) * 0.31539156525252005);\n" +
	                    "lpb += sh[7] * (vt0.z * vt0.x * -1.0925484305920792);\n" +
	                    "lpb += sh[8] * ((vt0.x * vt0.x - vt0.y * vt0.y) * 0.5462742152960396);\n" +
	                    "v2 = lpb;\n";
	        }
	        else if (directLight) {
	            $str +=
	                "float suncos = dot(vt0.xyz,sunDirect.xyz);\n" +
	                    "suncos = clamp(suncos,0.0,1.0);\n" +
	                    "v2 = sunColor * suncos + ambientColor;";
	            // "v2 += vec3(1.0,1.0,1.0);" 
	        }
	        else if (noLight) ;
	        else {
	            $str +=
	                "v2 = v2Uv;\n";
	        }
	        $str += "}";
	        //if (usePbr) {
	        //    if (!useNormal) {
	        //        $str += "v4 = vec3(v3Normal.x,v3Normal.y,v3Normal.z);\n";
	        //    } else {
	        //        $str += 
	        //        "v4 = mat3(v3Tangent,v3Bitangent,v3Normal);\n"
	        //    }
	        //}
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = 
	        //"#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
	        //"precision highp float;\n" +
	        //" #else\n" +
	        //" precision mediump float;\n" +
	        //" #endif\n" +
	        "uniform sampler2D s_texture1;\n" +
	            //"uniform sampler2D light_texture;\n" +
	            "uniform vec4 testconst;" +
	            "varying vec2 v_texCoord;\n" +
	            //"varying vec2 v_texLight;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(s_texture, v_texCoord.xy);\n" +
	            //"if (infoUv.a <= 0.9) {\n" +
	            //"     discard;\n" +
	            //"}\n" +
	            //"vec4 infoLight = texture2D(light_texture, v_texLight);\n" +
	            //"vec4 test = vec4(0.5,0,0,1);\n" +
	            "infoUv.xyz = testconst.xyz * infoUv.xyz;\n" +
	            //"info.rgb = info.rgb / 0.15;\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	MaterialAnimShader.MATERIAL_ANIM_SHADER = "Material_Anim_shader";

	class PlanarShadowShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec3 v3Position;" +
	            "uniform mat4 uMMatrix;" +
	            "uniform mat4 uMProjCameraMatrix;" +
	            "uniform vec3 uLightLocation;" +
	            "void main(void)" +
	            "{" +
	            "   vec3 A=vec3(0.0,0.1,0.0);" +
	            "   vec3 n=vec3(0.0,1.0,0.0);" +
	            "   vec3 S=uLightLocation;" +
	            "   vec3 V=(uMMatrix*vec4(v3Position,1)).xyz; " +
	            "   vec3 VL=S+(V-S)*(dot(n,(A-S))/dot(n,(V-S)));" +
	            "   gl_Position = uMProjCameraMatrix*vec4(VL,1);" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = "precision mediump float;\n" +
	            "void main(){\n" +
	            "   gl_FragColor = vec4(0,0,0,0.5);\n" +
	            "}\n";
	        return $str;
	    }
	    static makePlanarShadowShader() {
	        var planarShadowShader = new PlanarShadowShader();
	        planarShadowShader.encode();
	        return planarShadowShader;
	    }
	    static getInst() {
	        if (!PlanarShadowShader.singleton)
	            PlanarShadowShader.singleton = PlanarShadowShader.makePlanarShadowShader();
	        return PlanarShadowShader.singleton;
	    }
	    static setLightPos(v) {
	        PlanarShadowShader.lightPos.x = v.x;
	        PlanarShadowShader.lightPos.y = v.y;
	        PlanarShadowShader.lightPos.z = v.z;
	    }
	    static getLightPosArry(posMatrix) {
	        PlanarShadowShader.lightPosArray[0] = posMatrix.x + PlanarShadowShader.lightPos.x;
	        PlanarShadowShader.lightPosArray[1] = posMatrix.y + PlanarShadowShader.lightPos.y;
	        PlanarShadowShader.lightPosArray[2] = posMatrix.z + PlanarShadowShader.lightPos.z;
	        return PlanarShadowShader.lightPosArray;
	    }
	}
	PlanarShadowShader.PLANAR_SHADOW_SHADER = "PlanarShadowShader";
	PlanarShadowShader.lightPos = new Vector3D(3800, -4000, -1400);
	PlanarShadowShader.lightPosArray = new Float32Array([3800, -4000, -1400]);
	class AnimPlanarShadowShader extends MaterialAnimShader {
	    constructor() {
	        super();
	        this.name = AnimPlanarShadowShader.ANIM_PLANAR_SHADOW_SHADER;
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "pos");
	        $context.bindAttribLocation(this.program, 1, "v2Uv");
	        $context.bindAttribLocation(this.program, 2, "boneID");
	        $context.bindAttribLocation(this.program, 3, "boneWeight");
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec4 pos;\n" +
	            "attribute vec2 v2Uv;\n" +
	            "attribute vec4 boneID;\n" +
	            "attribute vec4 boneWeight;\n" +
	            "uniform vec4 boneQ[54];\n" +
	            "uniform vec3 boneD[54];\n" +
	            "uniform mat4 uMMatrix;" +
	            "uniform mat4 uMProjCameraMatrix;\n" +
	            "uniform vec3 uLightLocation;\n" +
	            MaterialAnimShader.getMd5M44Str() + "\n" +
	            "void main(void)" +
	            "{\n" +
	            "   vec4 v3Position = getQDdata(vec3(pos.x,pos.y,pos.z));\n" +
	            "   vec3 A=vec3(0.0,0.1,0.0);\n" +
	            "   vec3 n=vec3(0.0,1.0,0.0);\n" +
	            "   vec3 S=uLightLocation;\n" +
	            "   vec3 V=(uMMatrix*vec4(v3Position.xyz,1)).xyz;\n" +
	            "   vec3 VL=S+(V-S)*(dot(n,(A-S))/dot(n,(V-S)));\n" +
	            "   gl_Position = uMProjCameraMatrix*vec4(VL,1);\n" +
	            "}\n";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = "precision mediump float;\n" +
	            "void main(){\n" +
	            "   gl_FragColor = vec4(0,0,0,0.5);\n" +
	            "}\n";
	        return $str;
	    }
	}
	AnimPlanarShadowShader.ANIM_PLANAR_SHADOW_SHADER = "AnimPlanarShadowShader";
	/*

	在 Display3dMovie.ts 加入
	        public static planarShadowShader : PlanarShadowShader;
	        makePlanarShadowShader() {
	            var planarShadowShader = new PlanarShadowShader();
	            if(planarShadowShader.encode())
	            console.log("MAKE PlanarShadowShader！！！！");
	            return planarShadowShader;
	        }
	        

	        在 该类的updateMaterialMesh 函数， 加入

	        //shadow pass
	            //if(false)
	            {
	                var gl = Scene_data.context3D.renderContext;

	                //
	                if (!Display3dMovie.planarShadowShader) {
	                    Display3dMovie.planarShadowShader = this.makePlanarShadowShader();
	                }

	                //gl.useProgram(Display3dMovie.planarShadowShader.program);
	                Scene_data.context3D.setProgram(Display3dMovie.planarShadowShader.program);

	                Scene_data.context3D.setVcMatrix4fv(Display3dMovie.planarShadowShader, "uMProjCameraMatrix", new Float32Array (Scene_data.vpMatrix.m));
	                Scene_data.context3D.setVcMatrix4fv(Display3dMovie.planarShadowShader, "uMMatrix", new Float32Array(this.posMatrix.m));
	                Scene_data.context3D.setVc3fv(Display3dMovie.planarShadowShader, "uLightLocation", Display3dMovie.lightDirection);
	                
	                
	                {

	                    //gl.enableVertexAttribArray(gl.getAttribLocation(Display3dMovie.planarShadowShader.program, "v3Position"));
	                    //gl.bindBuffer(gl.ARRAY_BUFFER,$mesh.vertexBuffer);
	                    //gl.vertexAttribPointer(gl.getAttribLocation(Display3dMovie.planarShadowShader.program, "v3Position"), 3, gl.FLOAT, false, 0, 0);
	                    //gl.drawArrays(gl.TRIANGLES, 0,$mesh.treNum);

	                }
	                
	                
	                {
	                    this.setVa($mesh);
	                    //this.setMeshVc($mesh);

	                    Scene_data.context3D.drawCallL3d($mesh.treNum);
	                    
	                    $mesh._bufferState.unBind();
	                }
	            }


	*/

	class Quaternion {
	    constructor($x = 0, $y = 0, $z = 0, $w = 1) {
	        this.x = 0;
	        this.y = 0;
	        this.z = 0;
	        this.w = 1;
	        this.x = $x;
	        this.y = $y;
	        this.z = $z;
	        this.w = $w;
	    }
	    print() {
	        alert(String(this.x) + " " + String(this.y) + " " + String(this.z) + " " + String(this.w));
	    }
	    toEulerAngles(target = null) {
	        if (!target) {
	            target = new Vector3D;
	        }
	        var x = this.x, y = this.y, z = this.z, w = this.w;
	        target.x = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y));
	        target.y = Math.asin(2 * (w * y - z * x));
	        target.z = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
	        return target;
	    }
	    toMatrix3D($matrix3d = null) {
	        if (!$matrix3d) {
	            $matrix3d = new Matrix3D;
	        }
	        var out = $matrix3d.m;
	        var x = this.x, y = this.y, z = this.z, w = this.w, x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, yx = y * x2, yy = y * y2, zx = z * x2, zy = z * y2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
	        out[0] = 1 - yy - zz;
	        out[1] = yx + wz;
	        out[2] = zx - wy;
	        out[3] = 0;
	        out[4] = yx - wz;
	        out[5] = 1 - xx - zz;
	        out[6] = zy + wx;
	        out[7] = 0;
	        out[8] = zx + wy;
	        out[9] = zy - wx;
	        out[10] = 1 - xx - yy;
	        out[11] = 0;
	        out[12] = 0;
	        out[13] = 0;
	        out[14] = 0;
	        out[15] = 1;
	        return $matrix3d;
	    }
	    fromAxisAngle(axis, angle) {
	        var sin_a = Math.sin(angle / 2);
	        var cos_a = Math.cos(angle / 2);
	        this.x = axis.x * sin_a;
	        this.y = axis.y * sin_a;
	        this.z = axis.z * sin_a;
	        this.w = cos_a;
	        this.normalize();
	    }
	    normalize(val = 1) {
	        var mag = val / Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
	        this.x *= mag;
	        this.y *= mag;
	        this.z *= mag;
	        this.w *= mag;
	    }
	    fromMatrix($matrix) {
	        var m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	        m[0] = $matrix.m[0];
	        m[1] = $matrix.m[1];
	        m[2] = $matrix.m[2];
	        m[3] = $matrix.m[4];
	        m[4] = $matrix.m[5];
	        m[5] = $matrix.m[6];
	        m[6] = $matrix.m[8];
	        m[7] = $matrix.m[9];
	        m[8] = $matrix.m[10];
	        var fTrace = m[0] + m[4] + m[8];
	        var fRoot;
	        var out = [0, 0, 0, 0];
	        if (fTrace > 0.0) {
	            // |w| > 1/2, may as well choose w > 1/2
	            fRoot = Math.sqrt(fTrace + 1.0); // 2w
	            out[3] = 0.5 * fRoot;
	            fRoot = 0.5 / fRoot; // 1/(4w)
	            out[0] = (m[5] - m[7]) * fRoot;
	            out[1] = (m[6] - m[2]) * fRoot;
	            out[2] = (m[1] - m[3]) * fRoot;
	        }
	        else {
	            // |w| <= 1/2
	            var i = 0;
	            if (m[4] > m[0])
	                i = 1;
	            if (m[8] > m[i * 3 + i])
	                i = 2;
	            var j = (i + 1) % 3;
	            var k = (i + 2) % 3;
	            fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
	            out[i] = 0.5 * fRoot;
	            fRoot = 0.5 / fRoot;
	            out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
	            out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
	            out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
	        }
	        this.x = out[0];
	        this.y = out[1];
	        this.z = out[2];
	        this.w = out[3];
	    }
	    setMd5W() {
	        this.w = 1 - (this.x * this.x + this.y * this.y + this.z * this.z);
	        if (this.w < 0) {
	            this.w = 0;
	        }
	        else {
	            this.w = -Math.sqrt(this.w);
	        }
	    }
	    slerp(qa, qb, t) {
	        var w1 = qa.w, x1 = qa.x, y1 = qa.y, z1 = qa.z;
	        var w2 = qb.w, x2 = qb.x, y2 = qb.y, z2 = qb.z;
	        var dot = w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2;
	        // shortest direction
	        if (dot < 0) {
	            dot = -dot;
	            w2 = -w2;
	            x2 = -x2;
	            y2 = -y2;
	            z2 = -z2;
	        }
	        if (dot < 0.95) {
	            // interpolate angle linearly
	            var angle = Math.acos(dot);
	            var s = 1 / Math.sin(angle);
	            var s1 = Math.sin(angle * (1 - t)) * s;
	            var s2 = Math.sin(angle * t) * s;
	            this.w = w1 * s1 + w2 * s2;
	            this.x = x1 * s1 + x2 * s2;
	            this.y = y1 * s1 + y2 * s2;
	            this.z = z1 * s1 + z2 * s2;
	        }
	        else {
	            // nearly identical angle, interpolate linearly
	            this.w = w1 + t * (w2 - w1);
	            this.x = x1 + t * (x2 - x1);
	            this.y = y1 + t * (y2 - y1);
	            this.z = z1 + t * (z2 - z1);
	            var len = 1.0 / Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
	            this.w *= len;
	            this.x *= len;
	            this.y *= len;
	            this.z *= len;
	        }
	    }
	}

	class Matrix3D {
	    constructor() {
	        this.isIdentity = true;
	        var mk = [
	            1, 0, 0, 0,
	            0, 1, 0, 0,
	            0, 0, 1, 0,
	            0, 0, 0, 1
	        ];
	        this.m = new Float32Array(mk);
	    }
	    clone($target = null) {
	        //var $target: Matrix3D = new Matrix3D;
	        if (!$target) {
	            $target = new Matrix3D;
	        }
	        $target.m[0] = this.m[0];
	        $target.m[1] = this.m[1];
	        $target.m[2] = this.m[2];
	        $target.m[3] = this.m[3];
	        $target.m[4] = this.m[4];
	        $target.m[5] = this.m[5];
	        $target.m[6] = this.m[6];
	        $target.m[7] = this.m[7];
	        $target.m[8] = this.m[8];
	        $target.m[9] = this.m[9];
	        $target.m[10] = this.m[10];
	        $target.m[11] = this.m[11];
	        $target.m[12] = this.m[12];
	        $target.m[13] = this.m[13];
	        $target.m[14] = this.m[14];
	        $target.m[15] = this.m[15];
	        return $target;
	    }
	    get position() {
	        return new Vector3D(this.m[12], this.m[13], this.m[14], this.m[15]);
	    }
	    copyTo($target) {
	        $target.m[0] = this.m[0];
	        $target.m[1] = this.m[1];
	        $target.m[2] = this.m[2];
	        $target.m[3] = this.m[3];
	        $target.m[4] = this.m[4];
	        $target.m[5] = this.m[5];
	        $target.m[6] = this.m[6];
	        $target.m[7] = this.m[7];
	        $target.m[8] = this.m[8];
	        $target.m[9] = this.m[9];
	        $target.m[10] = this.m[10];
	        $target.m[11] = this.m[11];
	        $target.m[12] = this.m[12];
	        $target.m[13] = this.m[13];
	        $target.m[14] = this.m[14];
	        $target.m[15] = this.m[15];
	    }
	    identity() {
	        this.m[0] = 1;
	        this.m[1] = 0;
	        this.m[2] = 0;
	        this.m[3] = 0;
	        this.m[4] = 0;
	        this.m[5] = 1;
	        this.m[6] = 0;
	        this.m[7] = 0;
	        this.m[8] = 0;
	        this.m[9] = 0;
	        this.m[10] = 1;
	        this.m[11] = 0;
	        this.m[12] = 0;
	        this.m[13] = 0;
	        this.m[14] = 0;
	        this.m[15] = 1;
	    }
	    invert() {
	        var a = this.m;
	        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, 
	        // Calculate the determinant
	        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	        if (!det) {
	            return null;
	        }
	        det = 1.0 / det;
	        this.m[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	        this.m[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	        this.m[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	        this.m[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	        this.m[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	        this.m[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	        this.m[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	        this.m[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	        this.m[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	        this.m[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	        this.m[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	        this.m[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	        this.m[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	        this.m[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	        this.m[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	        this.m[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
	    }
	    invertToMatrix($target) {
	        var a = this.m;
	        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, 
	        // Calculate the determinant
	        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	        if (!det) {
	            return null;
	        }
	        det = 1.0 / det;
	        $target.m[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	        $target.m[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	        $target.m[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	        $target.m[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	        $target.m[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	        $target.m[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	        $target.m[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	        $target.m[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	        $target.m[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	        $target.m[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	        $target.m[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	        $target.m[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	        $target.m[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	        $target.m[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	        $target.m[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	        $target.m[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
	    }
	    appendTranslation(x, y, z) {
	        Matrix3D.tempM.identity();
	        Matrix3D.tempM.prependTranslation(x, y, z);
	        this.append(Matrix3D.tempM);
	    }
	    prependTranslation(x, y, z) {
	        var out = this.m;
	        out[12] = out[0] * x + out[4] * y + out[8] * z + out[12];
	        out[13] = out[1] * x + out[5] * y + out[9] * z + out[13];
	        out[14] = out[2] * x + out[6] * y + out[10] * z + out[14];
	        out[15] = out[3] * x + out[7] * y + out[11] * z + out[15];
	    }
	    transformVector($p) {
	        var out = new Vector3D;
	        out.x = this.m[0] * $p.x + this.m[4] * $p.y + this.m[8] * $p.z + this.m[12] * $p.w;
	        out.y = this.m[1] * $p.x + this.m[5] * $p.y + this.m[9] * $p.z + this.m[13] * $p.w;
	        out.z = this.m[2] * $p.x + this.m[6] * $p.y + this.m[10] * $p.z + this.m[14] * $p.w;
	        out.w = this.m[3] * $p.x + this.m[7] * $p.y + this.m[11] * $p.z + this.m[15] * $p.w;
	        return out;
	    }
	    append($matrx3d) {
	        Matrix3D.tempM.m[0] = $matrx3d.m[0];
	        Matrix3D.tempM.m[1] = $matrx3d.m[1];
	        Matrix3D.tempM.m[2] = $matrx3d.m[2];
	        Matrix3D.tempM.m[3] = $matrx3d.m[3];
	        Matrix3D.tempM.m[4] = $matrx3d.m[4];
	        Matrix3D.tempM.m[5] = $matrx3d.m[5];
	        Matrix3D.tempM.m[6] = $matrx3d.m[6];
	        Matrix3D.tempM.m[7] = $matrx3d.m[7];
	        Matrix3D.tempM.m[8] = $matrx3d.m[8];
	        Matrix3D.tempM.m[9] = $matrx3d.m[9];
	        Matrix3D.tempM.m[10] = $matrx3d.m[10];
	        Matrix3D.tempM.m[11] = $matrx3d.m[11];
	        Matrix3D.tempM.m[12] = $matrx3d.m[12];
	        Matrix3D.tempM.m[13] = $matrx3d.m[13];
	        Matrix3D.tempM.m[14] = $matrx3d.m[14];
	        Matrix3D.tempM.m[15] = $matrx3d.m[15];
	        Matrix3D.tempM.prepend(this);
	        this.m[0] = Matrix3D.tempM.m[0];
	        this.m[1] = Matrix3D.tempM.m[1];
	        this.m[2] = Matrix3D.tempM.m[2];
	        this.m[3] = Matrix3D.tempM.m[3];
	        this.m[4] = Matrix3D.tempM.m[4];
	        this.m[5] = Matrix3D.tempM.m[5];
	        this.m[6] = Matrix3D.tempM.m[6];
	        this.m[7] = Matrix3D.tempM.m[7];
	        this.m[8] = Matrix3D.tempM.m[8];
	        this.m[9] = Matrix3D.tempM.m[9];
	        this.m[10] = Matrix3D.tempM.m[10];
	        this.m[11] = Matrix3D.tempM.m[11];
	        this.m[12] = Matrix3D.tempM.m[12];
	        this.m[13] = Matrix3D.tempM.m[13];
	        this.m[14] = Matrix3D.tempM.m[14];
	        this.m[15] = Matrix3D.tempM.m[15];
	        /*
	        var $mat: Matrix3D = $matrx3d.clone();
	        $mat.prepend(this);

	        this.m[0] = $mat.m[0];
	        this.m[1] = $mat.m[1];
	        this.m[2] = $mat.m[2];
	        this.m[3] = $mat.m[3];
	        this.m[4] = $mat.m[4];
	        this.m[5] = $mat.m[5];
	        this.m[6] = $mat.m[6];
	        this.m[7] = $mat.m[7];
	        this.m[8] = $mat.m[8];
	        this.m[9] = $mat.m[9];
	        this.m[10] = $mat.m[10];
	        this.m[11] = $mat.m[11];
	        this.m[12] = $mat.m[12];
	        this.m[13] = $mat.m[13];
	        this.m[14] = $mat.m[14];
	        this.m[15] = $mat.m[15];
	        */
	    }
	    prepend($matrx3d) {
	        var b = $matrx3d.m;
	        var out = this.m;
	        var a = this.m;
	        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
	        // Cache only the current line of the second matrix
	        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
	        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	        b0 = b[4];
	        b1 = b[5];
	        b2 = b[6];
	        b3 = b[7];
	        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	        b0 = b[8];
	        b1 = b[9];
	        b2 = b[10];
	        b3 = b[11];
	        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	        b0 = b[12];
	        b1 = b[13];
	        b2 = b[14];
	        b3 = b[15];
	        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	    }
	    appendRotation(rad, axis) {
	        Matrix3D.tempM.identity();
	        Matrix3D.tempM.prependRotation(rad, axis);
	        this.append(Matrix3D.tempM);
	    }
	    tomat3() {
	        var mk = Array.prototype.concat.apply([], arguments);
	        mk = [
	            1, 0, 0,
	            0, 1, 0,
	            0, 0, 1
	        ];
	        var b = new Float32Array(mk);
	        b[0] = this.m[0];
	        b[1] = this.m[1];
	        b[2] = this.m[2];
	        b[3] = this.m[4];
	        b[4] = this.m[5];
	        b[5] = this.m[6];
	        b[6] = this.m[8];
	        b[7] = this.m[9];
	        b[8] = this.m[10];
	        return b;
	    }
	    getRotaion(b) {
	        b[0] = this.m[0];
	        b[1] = this.m[1];
	        b[2] = this.m[2];
	        b[3] = this.m[4];
	        b[4] = this.m[5];
	        b[5] = this.m[6];
	        b[6] = this.m[8];
	        b[7] = this.m[9];
	        b[8] = this.m[10];
	    }
	    identityPostion() {
	        this.m[12] = 0;
	        this.m[13] = 0;
	        this.m[14] = 0;
	    }
	    get x() {
	        return this.m[12];
	    }
	    get y() {
	        return this.m[13];
	    }
	    get z() {
	        return this.m[14];
	    }
	    prependRotation(rad, axis) {
	        var out = this.m;
	        var a = this.m;
	        var x = axis.x, y = axis.y, z = axis.z, len = Math.sqrt(x * x + y * y + z * z), s, c, t, a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, b00, b01, b02, b10, b11, b12, b20, b21, b22;
	        if (Math.abs(len) < 0.000001) {
	            return null;
	        }
	        len = 1 / len;
	        x *= len;
	        y *= len;
	        z *= len;
	        s = Math.sin(rad * Math.PI / 180);
	        c = Math.cos(rad * Math.PI / 180);
	        t = 1 - c;
	        a00 = a[0];
	        a01 = a[1];
	        a02 = a[2];
	        a03 = a[3];
	        a10 = a[4];
	        a11 = a[5];
	        a12 = a[6];
	        a13 = a[7];
	        a20 = a[8];
	        a21 = a[9];
	        a22 = a[10];
	        a23 = a[11];
	        // Construct the elements of the rotation matrix
	        b00 = x * x * t + c;
	        b01 = y * x * t + z * s;
	        b02 = z * x * t - y * s;
	        b10 = x * y * t - z * s;
	        b11 = y * y * t + c;
	        b12 = z * y * t + x * s;
	        b20 = x * z * t + y * s;
	        b21 = y * z * t - x * s;
	        b22 = z * z * t + c;
	        // Perform rotation-specific matrix multiplication
	        out[0] = a00 * b00 + a10 * b01 + a20 * b02;
	        out[1] = a01 * b00 + a11 * b01 + a21 * b02;
	        out[2] = a02 * b00 + a12 * b01 + a22 * b02;
	        out[3] = a03 * b00 + a13 * b01 + a23 * b02;
	        out[4] = a00 * b10 + a10 * b11 + a20 * b12;
	        out[5] = a01 * b10 + a11 * b11 + a21 * b12;
	        out[6] = a02 * b10 + a12 * b11 + a22 * b12;
	        out[7] = a03 * b10 + a13 * b11 + a23 * b12;
	        out[8] = a00 * b20 + a10 * b21 + a20 * b22;
	        out[9] = a01 * b20 + a11 * b21 + a21 * b22;
	        out[10] = a02 * b20 + a12 * b21 + a22 * b22;
	        out[11] = a03 * b20 + a13 * b21 + a23 * b22;
	        if (a !== out) { // If the source and destination differ, copy the unchanged last row
	            out[12] = a[12];
	            out[13] = a[13];
	            out[14] = a[14];
	            out[15] = a[15];
	        }
	        return out;
	    }
	    prependScale(x, y, z) {
	        var a = this.m;
	        var out = this.m;
	        out[0] = a[0] * x;
	        out[1] = a[1] * x;
	        out[2] = a[2] * x;
	        out[3] = a[3] * x;
	        out[4] = a[4] * y;
	        out[5] = a[5] * y;
	        out[6] = a[6] * y;
	        out[7] = a[7] * y;
	        out[8] = a[8] * z;
	        out[9] = a[9] * z;
	        out[10] = a[10] * z;
	        out[11] = a[11] * z;
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	        return out;
	    }
	    ;
	    appendScale(x, y, z) {
	        Matrix3D.tempM.identity();
	        Matrix3D.tempM.prependScale(x, y, z);
	        this.append(Matrix3D.tempM);
	    }
	    setClipPlan(zNear, zFar) {
	        this.m[10] = zFar / (zFar - zNear);
	        this.m[14] = (zNear * zFar) / (zNear - zFar);
	    }
	    perspectiveFieldOfViewLH(fieldOfViewY, aspectRatio, zNear, zFar) {
	        var yScale = 1.0 / Math.tan(fieldOfViewY / 2.0);
	        var xScale = yScale / aspectRatio;
	        var out = this.m;
	        out[0] = xScale;
	        out[1] = 0;
	        out[2] = 0;
	        out[3] = 0;
	        out[4] = 0;
	        out[5] = yScale;
	        out[6] = 0;
	        out[7] = 0;
	        out[8] = 0;
	        out[9] = 0;
	        out[10] = zFar / (zFar - zNear);
	        out[11] = 1;
	        out[12] = 0;
	        out[13] = 0;
	        out[14] = (zNear * zFar) / (zNear - zFar);
	        out[15] = 0;
	        /*
	          public function perspectiveFieldOfViewLH(fieldOfViewY:Number,
	                                                 aspectRatio:Number,
	                                                 zNear:Number,
	                                                 zFar:Number):void {
	            var yScale:Number = 1.0/Math.tan(fieldOfViewY/2.0);
	            var xScale:Number = yScale / aspectRatio;
	            this.copyRawDataFrom(Vector.<Number>([
	                xScale, 0.0, 0.0, 0.0,
	                0.0, yScale, 0.0, 0.0,
	                0.0, 0.0, zFar/(zFar-zNear), 1.0,
	                0.0, 0.0, (zNear*zFar)/(zNear-zFar), 0.0
	            ]));
	        }

	        */
	    }
	    fromVtoV($basePos, $newPos) {
	        var axis = $basePos.cross($newPos);
	        axis.normalize();
	        var angle = Math.acos($basePos.dot($newPos));
	        var q = new Quaternion();
	        q.fromAxisAngle(axis, angle);
	        q.toMatrix3D(this);
	    }
	    buildLookAtLH(eyePos, lookAt, up) {
	        var out = this.m;
	        var zaxis = new Vector3D;
	        zaxis.x = lookAt.x - eyePos.x;
	        zaxis.y = lookAt.y - eyePos.y;
	        zaxis.z = lookAt.z - eyePos.z;
	        zaxis.normalize();
	        var xaxis = up.cross(zaxis);
	        xaxis.normalize();
	        var yaxis = zaxis.cross(xaxis);
	        out[0] = xaxis.x;
	        out[1] = yaxis.x;
	        out[2] = zaxis.x;
	        out[3] = 0.0;
	        out[4] = xaxis.y;
	        out[5] = yaxis.y;
	        out[6] = zaxis.y;
	        out[7] = 0.0;
	        out[8] = xaxis.z;
	        out[9] = yaxis.z;
	        out[10] = zaxis.z;
	        out[11] = 0.0;
	        out[12] = -xaxis.dot(eyePos);
	        out[13] = -yaxis.dot(eyePos);
	        out[14] = -zaxis.dot(eyePos);
	        out[15] = 1.0;
	    }
	    static mul(a, b, c) {
	        var d = b[0], e = b[1], f = b[2], g = b[3], h = b[4], k = b[5], l = b[6], m = b[7], n = b[8], r = b[9], p = b[10], q = b[11], u = b[12], s = b[13], z = b[14];
	        b = b[15];
	        var t = c[0], v = c[1], w = c[2], x = c[3];
	        a[0] = t * d + v * h + w * n + x * u;
	        a[1] = t * e + v * k + w * r + x * s;
	        a[2] = t * f + v * l + w * p + x * z;
	        a[3] = t * g + v * m + w * q + x * b;
	        t = c[4];
	        v = c[5];
	        w = c[6];
	        x = c[7];
	        a[4] = t * d + v * h + w * n + x * u;
	        a[5] = t * e + v * k + w * r + x * s;
	        a[6] = t * f + v * l + w * p + x * z;
	        a[7] = t * g + v * m + w * q + x * b;
	        t = c[8];
	        v = c[9];
	        w = c[10];
	        x = c[11];
	        a[8] = t * d + v * h + w * n + x * u;
	        a[9] = t * e + v * k + w * r + x * s;
	        a[10] = t * f + v * l + w * p + x * z;
	        a[11] =
	            t * g + v * m + w * q + x * b;
	        t = c[12];
	        v = c[13];
	        w = c[14];
	        x = c[15];
	        a[12] = t * d + v * h + w * n + x * u;
	        a[13] = t * e + v * k + w * r + x * s;
	        a[14] = t * f + v * l + w * p + x * z;
	        a[15] = t * g + v * m + w * q + x * b;
	        return a;
	    }
	    toEulerAngles(target = null) {
	        var $q = new Quaternion();
	        $q.fromMatrix(this);
	        return $q.toEulerAngles(target);
	    }
	}
	Matrix3D.tempM = new Matrix3D();

	class EventDispatcher {
	    constructor() {
	        this._eventsMap = null;
	    }
	    addEventListener(types, listener, thisObject) {
	        if (!this._eventsMap) {
	            this._eventsMap = new Object;
	        }
	        var list = this._eventsMap[types];
	        if (!list) {
	            list = this._eventsMap[types] = [];
	        }
	        var eventBin = { listener: listener, thisObject: thisObject };
	        for (var i = 0; i < list.length; i++) {
	            var bin = list[i];
	            if (bin.listener == listener && bin.thisObject == thisObject) {
	                return;
	            }
	        }
	        list.push(eventBin);
	    }
	    removeEventListener(type, listener, thisObject) {
	        if (this._eventsMap == null) {
	            return;
	        }
	        var list = this._eventsMap[type];
	        for (var i = 0; list && i < list.length; i++) {
	            var bin = list[i];
	            if (bin.listener == listener && bin.thisObject == thisObject) {
	                list.splice(i, 1);
	                return;
	            }
	        }
	    }
	    dispatchEvent(event) {
	        var eventMap = this._eventsMap;
	        if (!eventMap) {
	            return true;
	        }
	        var list = eventMap[event.type];
	        if (!list) {
	            return true;
	        }
	        var length = list.length;
	        if (length == 0) {
	            return true;
	        }
	        event.target = this;
	        for (var i = 0; i < length; i++) {
	            var eventBin = list[i];
	            eventBin.listener.call(eventBin.thisObject, event);
	        }
	    }
	}

	class Object3D extends EventDispatcher {
	    constructor($x = 0, $y = 0, $z = 0) {
	        super();
	        this._x = $x;
	        this._y = $y;
	        this._z = $z;
	        this._scaleX = 1;
	        this._scaleY = 1;
	        this._scaleZ = 1;
	        this._rotationX = 0;
	        this._rotationY = 0;
	        this._rotationZ = 0;
	        this.posMatrix = new Matrix3D;
	        this.orgPosMatrix = new Matrix3D;
	    }
	    toStringout() {
	        return "Object3D(" + String(this._x) + "," + String(this._y) + "," + String(this._z) + ")";
	    }
	    set x(value) {
	        this._x = value;
	        this.updateMatrix();
	    }
	    get x() {
	        return this._x;
	    }
	    set y(value) {
	        this._y = value;
	        this.updateMatrix();
	    }
	    get y() {
	        return this._y;
	    }
	    set z(value) {
	        this._z = value;
	        this.updateMatrix();
	    }
	    get z() {
	        return this._z;
	    }
	    set scale(value) {
	        this._scaleX = this._scaleY = this._scaleZ = value;
	        this.updateMatrix();
	    }
	    set scaleX(value) {
	        this._scaleX = value;
	        this.updateMatrix();
	    }
	    get scaleX() {
	        return this._scaleX;
	    }
	    set scaleY(value) {
	        this._scaleY = value;
	        this.updateMatrix();
	    }
	    get scaleY() {
	        return this._scaleY;
	    }
	    set scaleZ(value) {
	        this._scaleZ = value;
	        this.updateMatrix();
	    }
	    get scaleZ() {
	        return this._scaleZ;
	    }
	    set rotationX(value) {
	        this._rotationX = value;
	        this.updateMatrix();
	        this.updateRotationMatrix();
	    }
	    get rotationX() {
	        return this._rotationX;
	    }
	    set rotationY(value) {
	        this._rotationY = value;
	        this.updateMatrix();
	        this.updateRotationMatrix();
	    }
	    get rotationY() {
	        return this._rotationY;
	    }
	    set rotationZ(value) {
	        this._rotationZ = value;
	        this.updateMatrix();
	        this.updateRotationMatrix();
	    }
	    get rotationZ() {
	        return this._rotationZ;
	    }
	    get px() { return 0; }
	    set px(val) { }
	    get py() { return 0; }
	    set py(val) { }
	    get pz() { return 0; }
	    set pz(val) { }
	    updateMatrix() {
	        this.posMatrix.identity();
	        this.posMatrix.appendScale(this._scaleX * SceneManager.scaleWorld.x, this._scaleY * SceneManager.scaleWorld.y, this._scaleZ * SceneManager.scaleWorld.z);
	        this.posMatrix.appendRotation(this._rotationX, Vector3D.X_AXIS);
	        this.posMatrix.appendRotation(this._rotationY, Vector3D.Y_AXIS);
	        this.posMatrix.appendRotation(this._rotationZ, Vector3D.Z_AXIS);
	        this.posMatrix.appendTranslation(this._x * SceneManager.scaleWorld.x, this._y * SceneManager.scaleWorld.y, this._z * SceneManager.scaleWorld.z);
	    }
	    getOrgPosMatrix() {
	        this.orgPosMatrix.identity();
	        this.orgPosMatrix.appendScale(this._scaleX, this._scaleY, this._scaleZ);
	        this.orgPosMatrix.appendRotation(this._rotationX, Vector3D.X_AXIS);
	        this.orgPosMatrix.appendRotation(this._rotationY, Vector3D.Y_AXIS);
	        this.orgPosMatrix.appendRotation(this._rotationZ, Vector3D.Z_AXIS);
	        this.orgPosMatrix.appendTranslation(this._x, this._y, this._z);
	        return this.orgPosMatrix;
	    }
	    updateRotationMatrix() {
	    }
	}

	class Display3D extends Object3D {
	    constructor() {
	        super();
	        this.sceneVisible = true;
	        this._hasDestory = false;
	        this._onStage = false;
	    }
	    update() {
	    }
	    get onStage() {
	        return this._onStage;
	    }
	    addStage() {
	        this._onStage = true;
	    }
	    removeStage() {
	        this._onStage = false;
	    }
	    resize() {
	    }
	    destory() {
	        this.sceneVisible = false;
	        if (this.objData) {
	            this.objData.useNum--;
	        }
	    }
	}

	class DynamicBaseConstItem {
	    update(t = 0) {
	        if (this.target) {
	            this.target.setDynamic(this);
	        }
	    }
	    get type() {
	        return this._type;
	    }
	    set type(value) {
	        this._type = value;
	    }
	    setTargetInfo($target, $paramName, $type) {
	        this.target = $target;
	        this.paramName = $paramName;
	        this.type = $type;
	        if (this.target) {
	            this.target.setDynamicOffset(this);
	        }
	        this.currentValue = new Array($type);
	    }
	    setCurrentVal(...args) {
	        for (var i = 0; i < args.length; i++) {
	            this.currentValue[i] = args[i];
	            // if (i == 0) {
	            //     this.currentValue.x = args[i];
	            // } else if (i == 1) {
	            //     this.currentValue.y = args[i];
	            // } else if (i == 2) {
	            //     this.currentValue.z = args[i];
	            // }
	        }
	    }
	}

	class DynamicBaseTexItem {
	    destory() {
	        if (this.textureRes) {
	            this.textureRes.useNum--;
	        }
	        this.target = null;
	    }
	    get texture() {
	        if (this.textureRes) {
	            return this.textureRes.texture;
	        }
	        return null;
	    }
	}

	class ResGC {
	    constructor() {
	        this._dic = new Object();
	        TimeUtil.addTimeTick(60000, () => { this.gc(); });
	    }
	    gc() {
	        //var a:number = 1;
	        for (var key in this._dic) {
	            var rc = this._dic[key];
	            if (rc.useNum <= 0) {
	                rc.idleTime++;
	                if (rc.idleTime >= ResCount.GCTime) {
	                    //console.log("清理 -" + key);
	                    rc.destory();
	                    delete this._dic[key];
	                }
	            }
	        }
	    }
	}

	/**
	* base64-arraybuffer
	*/
	class Base64 {
	}
	Base64.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	Base64.encode = function (arraybuffer) {
	    var bytes = new Uint8Array(arraybuffer), i, len = bytes.length, base64 = "";
	    for (i = 0; i < len; i += 3) {
	        base64 += this.chars[bytes[i] >> 2];
	        base64 += this.chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
	        base64 += this.chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
	        base64 += this.chars[bytes[i + 2] & 63];
	    }
	    if ((len % 3) === 2) {
	        base64 = base64.substring(0, base64.length - 1) + "=";
	    }
	    else if (len % 3 === 1) {
	        base64 = base64.substring(0, base64.length - 2) + "==";
	    }
	    return base64;
	};
	Base64.decode = function (base64) {
	    var bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
	    if (base64[base64.length - 1] === "=") {
	        bufferLength--;
	        if (base64[base64.length - 2] === "=") {
	            bufferLength--;
	        }
	    }
	    var arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
	    for (i = 0; i < len; i += 4) {
	        encoded1 = this.chars.indexOf(base64[i]);
	        encoded2 = this.chars.indexOf(base64[i + 1]);
	        encoded3 = this.chars.indexOf(base64[i + 2]);
	        encoded4 = this.chars.indexOf(base64[i + 3]);
	        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
	        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
	        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
	    }
	    return arraybuffer;
	};

	class LoadManager {
	    constructor() {
	        this._loadThreadList = new Array;
	        this._waitLoadList = new Array;
	        for (var i = 0; i < 5; i++) {
	            this._loadThreadList.push(new LoaderThread());
	        }
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new LoadManager();
	        }
	        return this._instance;
	    }
	    getVersion(vkey) {
	        if (this._versions) {
	            return this._versions[vkey] || vkey;
	        }
	        return vkey;
	    }
	    load($url, $type, $fun, $info = null, $progressFun = null) {
	        if (Scene_data.fileRoot != "") { //原生版本优化
	            $url = $url.replace(Scene_data.fileRoot, "");
	            $url = Scene_data.fileRoot + this.getVersion($url);
	        }
	        var loadInfo = new LoadInfo($url, $type, $fun, $info, $progressFun);
	        for (var i = 0; i < this._loadThreadList.length; i++) {
	            if (this._loadThreadList[i].idle) {
	                this._loadThreadList[i].load(loadInfo);
	                return;
	            }
	        }
	        this._waitLoadList.push(loadInfo);
	    }
	    loadWaitList() {
	        if (this._waitLoadList.length <= 0) {
	            return;
	        }
	        for (var i = 0; i < this._loadThreadList.length; i++) {
	            if (this._loadThreadList[i].idle) {
	                this._loadThreadList[i].load(this._waitLoadList.shift());
	                return;
	            }
	        }
	    }
	}
	LoadManager.BYTE_TYPE = "BYTE_TYPE";
	LoadManager.IMG_TYPE = "IMG_TYPE";
	LoadManager.XML_TYPE = "XML_TYPE";
	class LoaderThread {
	    constructor() {
	        this._xhr = new XMLHttpRequest();
	        this._xhr.onreadystatechange = () => {
	            if (!this._xhr || this._xhr.readyState !== 4) {
	                return;
	            }
	            if (this._xhr.status !== 0 && this._xhr.status !== 200) {
	                this.loadError();
	                return;
	            }
	            this.loadByteXML();
	        };
	        this._xhr.onprogress = (e) => {
	            if (this._loadInfo.progressFun) {
	                this._loadInfo.progressFun(e.loaded / e.total);
	            }
	        };
	        this._xhr.onerror = () => {
	            this.loadError();
	        };
	        this._img = new Image();
	        this._img.onload = () => {
	            this.loadImg();
	        };
	        this._img.onerror = () => {
	            this.loadError();
	        };
	        this.idle = true;
	    }
	    load(loadInfo) {
	        this._loadInfo = loadInfo;
	        this.idle = false;
	        this._url = loadInfo.url;
	        if (this._loadInfo.type == LoadManager.BYTE_TYPE) {
	            this._xhr.open("GET", loadInfo.vurl, true);
	            this._xhr.responseType = "arraybuffer";
	            this._xhr.send();
	        }
	        else if (this._loadInfo.type == LoadManager.XML_TYPE) {
	            this._xhr.open("GET", loadInfo.vurl, true);
	            this._xhr.responseType = "text";
	            this._xhr.send();
	        }
	        else if (this._loadInfo.type == LoadManager.IMG_TYPE) {
	            if (this._img.url == loadInfo.vurl) { //路径相同
	                this.loadImg();
	            }
	            else { //执行加载
	                this._img.url = loadInfo.vurl;
	                this._img.src = loadInfo.vurl;
	            }
	        }
	    }
	    loadError() {
	        this.idle = true;
	        this._loadInfo = null;
	        LoadManager.getInstance().loadWaitList();
	    }
	    loadByteXML() {
	        // if(this.idle){
	        //     //console.log("加载完成*****************************"+this._url );
	        // }
	        if (this._loadInfo.info) {
	            this._loadInfo.fun(this._xhr.response, this._loadInfo.info);
	        }
	        else {
	            this._loadInfo.fun(this._xhr.response);
	        }
	        this.idle = true;
	        this._loadInfo = null;
	        LoadManager.getInstance().loadWaitList();
	    }
	    loadByteImg() {
	        this._img.src = 'data:image/png;base64,' + Base64.encode(this._xhr.response);
	    }
	    loadImg() {
	        if (this._loadInfo.info) {
	            this._loadInfo.fun(this._img, this._loadInfo.info);
	        }
	        else {
	            this._loadInfo.fun(this._img);
	        }
	        this.idle = true;
	        this._loadInfo = null;
	        LoadManager.getInstance().loadWaitList();
	    }
	}
	class LoadInfo {
	    constructor($url, $type, $fun, $info = null, $progressFun = null) {
	        this.url = $url;
	        this.type = $type;
	        this.fun = $fun;
	        this.info = $info;
	        this.progressFun = $progressFun;
	    }
	    get vurl() {
	        return this.url;
	    }
	}

	class UIManager {
	    constructor() {
	        this._canvas = document.createElement("canvas");
	        this._canvas.style.zIndex = "3";
	        this._canvas.width = 200;
	        this._canvas.height = 200;
	        this._canvas.style.left = 200;
	        this._canvas.style.top = 300;
	        this._ctx = this._canvas.getContext("2d");
	        this._ctx.textBaseline = "top";
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new UIManager();
	            UIManager.popClikNameFun = ($name, $id = 0) => { this.uiClikName($name, $id); };
	        }
	        return this._instance;
	    }
	    static uiClikName($name, $id) {
	    }
	    getContext2D($width, $height, alianDefault = true) {
	        this._canvas.width = $width;
	        this._canvas.height = $height;
	        this._ctx.clearRect(0, 0, $width, $height);
	        alianDefault = true;
	        if (alianDefault) {
	            this._ctx.textBaseline = "top";
	            this._ctx.textAlign = "left";
	        }
	        return this._ctx;
	    }
	    getGrayImageDatabyImg($img) {
	        var $ctx = UIManager.getInstance().getContext2D($img.width, $img.height, false);
	        $ctx.drawImage($img, 0, 0);
	        var $imgData = $ctx.getImageData(0, 0, $img.width, $img.height);
	        var $gray;
	        for (var i = 0; i < $imgData.data.length; i += 4) {
	            $gray = Math.floor($imgData.data[i + 0] * 0.3) + Math.floor($imgData.data[i + 1] * 0.59) + Math.floor($imgData.data[i + 2] * 0.11);
	            $imgData.data[i + 0] = $gray;
	            $imgData.data[i + 1] = $gray;
	            $imgData.data[i + 2] = $gray;
	        }
	        return $imgData;
	    }
	    makeCtxToGray($ctx, $rect) {
	        var $imgData = $ctx.getImageData($rect.x, $rect.y, $rect.width, $rect.height);
	        var $gray;
	        for (var i = 0; i < $imgData.data.length; i += 4) {
	            $gray = Math.floor($imgData.data[i + 0] * 0.3) + Math.floor($imgData.data[i + 1] * 0.59) + Math.floor($imgData.data[i + 2] * 0.11);
	            $gray = $gray * 0.5 + 0.5;
	            $imgData.data[i + 0] = $gray;
	            $imgData.data[i + 1] = $gray;
	            $imgData.data[i + 2] = $gray;
	        }
	        $ctx.putImageData($imgData, $rect.x, $rect.y);
	    }
	    showCanvas($x = 0, $y = 0) {
	        this._canvas.style.left = $x;
	        this._canvas.style.top = $y;
	        document.getElementById("root").appendChild(this._canvas);
	    }
	}
	UIManager.cando = true; //  标记只会选择一次。此循环结束

	class TextureRes extends ResCount {
	    destory() {
	        Scene_data.context3D.deleteTexture(this.texture);
	    }
	}

	class TextureManager extends ResGC {
	    constructor() {
	        super();
	        this._loadDic = new Object();
	        this._resDic = new Object();
	        this.initDefaultLightMapTexture();
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new TextureManager();
	        }
	        return this._instance;
	    }
	    hasTexture($url) {
	        if (this._dic[$url]) {
	            return true;
	        }
	        return false;
	    }
	    getTexture($url, $fun, $wrapType = 0, $info = null, $filteType = 0, $mipmapType = 0) {
	        // if ($url.indexOf("zc_deng_00.png") != -1) {
	        //    //console.log("22222");
	        // }
	        if (this._dic[$url]) {
	            if ($info) {
	                $fun(this._dic[$url], $info);
	            }
	            else {
	                $fun(this._dic[$url]);
	            }
	            this._dic[$url].useNum++;
	            return;
	        }
	        var textureLoad = new TextureLoad($fun, $info, $url, $wrapType, $filteType, $mipmapType);
	        if (this._loadDic[$url]) {
	            var ary = this._loadDic[$url];
	            ary.push(textureLoad);
	            return;
	        }
	        this._loadDic[$url] = new Array;
	        this._loadDic[$url].push(textureLoad);
	        if (this._resDic[$url]) {
	            this.loadTextureCom(this._resDic[$url], textureLoad);
	            delete this._resDic[$url];
	        }
	        else {
	            LoadManager.getInstance().load($url, LoadManager.IMG_TYPE, ($img, _info) => {
	                this.loadTextureCom($img, _info);
	            }, textureLoad);
	        }
	    }
	    getImageData($url, $fun) {
	        LoadManager.getInstance().load($url, LoadManager.IMG_TYPE, ($img) => {
	            var ctx = UIManager.getInstance().getContext2D($img.width, $img.height, false);
	            ctx.drawImage($img, 0, 0, $img.width, $img.height);
	            var imgData = ctx.getImageData(0, 0, $img.width, $img.height);
	            $fun(imgData);
	        });
	    }
	    getImgResByurl($url) {
	        return this._resDic[$url];
	    }
	    addRes($url, $img) {
	        if (!this._dic[$url] && !this._resDic[$url]) {
	            this._resDic[$url] = $img;
	        }
	    }
	    addImgRes($url, $img) {
	        this._resDic[$url] = $img;
	        var texture = Scene_data.context3D.getTexture($img);
	        var textres = new TextureRes();
	        textres.texture = texture;
	        textres.width = $img.width;
	        textres.height = $img.height;
	        textres.useNum++;
	        this._dic[$url] = textres;
	    }
	    getCanvasTexture(ctx) {
	        var tres = new TextureRes;
	        var texture = Scene_data.context3D.getTexture(ctx.canvas, 0, 0);
	        tres.texture = texture;
	        return tres;
	    }
	    getImageDataTexture(imgdata) {
	        var texture = Scene_data.context3D.getTexture(imgdata, 0, 0);
	        return texture;
	    }
	    getTextureRes($img) {
	        var tres = new TextureRes;
	        var texture = Scene_data.context3D.getTexture($img, 0, 0);
	        tres.texture = texture;
	        return tres;
	    }
	    updateTexture($texture, $offsetx, $offsety, ctx) {
	        Scene_data.context3D.updateTexture($texture, $offsetx, $offsety, ctx.canvas);
	    }
	    loadTextureCom($img, _info) {
	        var texture = Scene_data.context3D.getTexture($img, _info.wrap, _info.filter, _info.mipmap);
	        var textres = new TextureRes();
	        textres.texture = texture;
	        textres.width = $img.width;
	        textres.height = $img.height;
	        var ary = this._loadDic[_info.url];
	        for (var i = 0; i < ary.length; i++) {
	            if (ary[i].info) {
	                ary[i].fun(textres, ary[i].info);
	            }
	            else {
	                ary[i].fun(textres);
	            }
	            textres.useNum++;
	        }
	        delete this._loadDic[_info.url];
	        this._dic[_info.url] = textres;
	    }
	    initDefaultLightMapTexture() {
	        var canvas = document.createElement("canvas");
	        var ctx = canvas.getContext("2d");
	        canvas.width = 32;
	        canvas.height = 32;
	        ctx.fillStyle = "rgb(" + 255 / 5 + "," + 255 / 5 + "," + 255 / 5 + ")";
	        ctx.fillRect(0, 0, 32, 32);
	        this.defaultLightMap = Scene_data.context3D.getTexture(canvas);
	    }
	    gc() {
	        super.gc();
	    }
	}
	class TextureLoad {
	    constructor($fun, $info, $url, $wrap, $filter, $mipmap) {
	        this.fun = $fun;
	        this.info = $info;
	        this.url = $url;
	        this.wrap = $wrap;
	        this.filter = $filter;
	        this.mipmap = $mipmap;
	    }
	}

	class MaterialBaseParam extends GC {
	    destory() {
	        for (var i = 0; i < this.dynamicTexList.length; i++) {
	            this.dynamicTexList[i].destory();
	        }
	        this.dynamicTexList = null;
	        this.dynamicConstList = null;
	    }
	    update() {
	        if (this.material && this.dynamicConstList) {
	            for (var i = 0; i < this.dynamicConstList.length; i++) {
	                this.dynamicConstList[i].update();
	            }
	        }
	    }
	    setData($material, $ary) {
	        this.material = $material;
	        this.dynamicConstList = new Array;
	        this.dynamicTexList = new Array;
	        var constList = $material.constList;
	        var texList = $material.texList;
	        for (var i = 0; i < $ary.length; i++) {
	            var obj = $ary[i];
	            if (obj.type == 0) {
	                var texItem = new DynamicBaseTexItem();
	                texItem.paramName = obj.name;
	                for (var j = 0; j < texList.length; j++) {
	                    if (texItem.paramName == texList[j].paramName) {
	                        texItem.target = texList[j];
	                        break;
	                    }
	                }
	                var mipmap = 0;
	                if (texItem.target) {
	                    mipmap = texItem.target.mipmap;
	                }
	                mipmap = 0;
	                TextureManager.getInstance().getTexture(Scene_data.fileRoot + obj.url, ($textres) => {
	                    texItem.textureRes = $textres;
	                }, 0, null, 0, mipmap);
	                this.dynamicTexList.push(texItem);
	            }
	            else {
	                var targetName = obj.name;
	                var target = null;
	                for (var j = 0; j < constList.length; j++) {
	                    if (targetName == constList[j].paramName0
	                        || targetName == constList[j].paramName1
	                        || targetName == constList[j].paramName2
	                        || targetName == constList[j].paramName3) {
	                        target = constList[j];
	                        break;
	                    }
	                }
	                var constItem = new DynamicBaseConstItem();
	                constItem.setTargetInfo(target, targetName, obj.type);
	                if (obj.type == 1) {
	                    constItem.setCurrentVal(obj.x);
	                }
	                else if (obj.type == 2) {
	                    constItem.setCurrentVal(obj.x, obj.y);
	                }
	                else {
	                    constItem.setCurrentVal(obj.x, obj.y, obj.z);
	                }
	                this.dynamicConstList.push(constItem);
	            }
	        }
	    }
	}

	class ObjData extends ResCount {
	    constructor() {
	        super();
	        this.vertices = new Array;
	        this.uvs = new Array;
	        this.indexs = new Array;
	        this.lightuvs = new Array;
	        this.normals = new Array;
	        this.tangents = new Array;
	        this.bitangents = new Array;
	        this.treNum = 0;
	        /**顶点 uv lightuv normal 合成一个 va */
	        this.compressBuffer = false;
	        this.hasdispose = false;
	        this.indexFormat = exports.IndexFormat.UInt16;
	        this._bufferState = new BufferState;
	    }
	    /**
	     * @internal
	     */
	    _setBuffer(vertexBuffer, indexBuffer) {
	        var bufferState = this._bufferState;
	        bufferState.bind();
	        bufferState.applyVertexBuffer(vertexBuffer);
	        bufferState.applyIndexBuffer(indexBuffer);
	        bufferState.unBind();
	    }
	    destory() {
	        this.vertices.length = 0;
	        this.vertices = null;
	        this.uvs.length = 0;
	        this.uvs = null;
	        this.indexs.length = 0;
	        this.indexs = null;
	        this.lightuvs.length = 0;
	        this.lightuvs = null;
	        this.normals.length = 0;
	        this.normals = null;
	        this.tangents.length = 0;
	        this.tangents = null;
	        this.bitangents.length = 0;
	        this.bitangents = null;
	        if (this.vertexBuffer) {
	            Scene_data.context3D.deleteBuffer(this.vertexBuffer);
	            this.vertexBuffer = null;
	        }
	        if (this.uvBuffer) {
	            Scene_data.context3D.deleteBuffer(this.uvBuffer);
	            this.uvBuffer = null;
	        }
	        if (this.indexBuffer) {
	            Scene_data.context3D.deleteBuffer(this.indexBuffer);
	            this.indexBuffer = null;
	        }
	        if (this.lightUvBuffer) {
	            Scene_data.context3D.deleteBuffer(this.lightUvBuffer);
	            this.lightUvBuffer = null;
	        }
	        if (this.normalsBuffer) {
	            Scene_data.context3D.deleteBuffer(this.normalsBuffer);
	            this.normalsBuffer = null;
	        }
	        if (this.tangentBuffer) {
	            Scene_data.context3D.deleteBuffer(this.tangentBuffer);
	            this.tangentBuffer = null;
	        }
	        if (this.bitangentBuffer) {
	            Scene_data.context3D.deleteBuffer(this.bitangentBuffer);
	            this.bitangentBuffer = null;
	        }
	        this.hasdispose = true;
	    }
	}

	class TexItem {
	    destory() {
	        if (this.textureRes) {
	            this.textureRes.clearUseNum();
	        }
	    }
	    set id(value) {
	        this._id = value;
	        this.name = "fs" + value;
	    }
	    get id() {
	        return this._id;
	    }
	    get texture() {
	        if (this.textureRes) {
	            return this.textureRes.texture;
	        }
	        else {
	            return null;
	        }
	    }
	}
	TexItem.LIGHTMAP = 1;
	TexItem.LTUMAP = 2;
	TexItem.CUBEMAP = 3;
	TexItem.HEIGHTMAP = 4;
	TexItem.REFRACTIONMAP = 5;

	/**
	*
	*
	* pramaType 0 表示无类型 1表示 float 2表示 vec2 3表示vec3
	*/
	class ConstItem {
	    constructor() {
	        this.value = new Vector3D;
	        this.offset = 0;
	    }
	    set id(value) {
	        this._id = value;
	        this.name = "fc" + value;
	        this.offset = value * 4;
	    }
	    get id() {
	        return this._id;
	    }
	    creat($vc) {
	        this.vecNum = $vc;
	        this.vecNum[0 + this.offset] = this.value.x;
	        this.vecNum[1 + this.offset] = this.value.y;
	        this.vecNum[2 + this.offset] = this.value.z;
	        this.vecNum[3 + this.offset] = this.value.w;
	    }
	    setData(obj) {
	        this.id = obj.id;
	        this.value = new Vector3D(obj.value.x, obj.value.y, obj.value.z, obj.value.w);
	        this.paramName0 = obj.paramName0;
	        this.param0Type = obj.param0Type;
	        this.param0Index = obj.param0Index;
	        this.paramName1 = obj.paramName1;
	        this.param1Type = obj.param1Type;
	        this.param1Index = obj.param1Index;
	        this.paramName2 = obj.paramName2;
	        this.param2Type = obj.param2Type;
	        this.param2Index = obj.param2Index;
	        this.paramName3 = obj.paramName3;
	        this.param3Type = obj.param3Type;
	        this.param3Index = obj.param3Index;
	    }
	    setDynamicOffset($dynamic) {
	        if (this.paramName0 == $dynamic.paramName) {
	            $dynamic.targetOffset = this.param0Index + this.offset;
	        }
	        else if (this.paramName1 == $dynamic.paramName) {
	            $dynamic.targetOffset = this.param1Index + this.offset;
	        }
	        else if (this.paramName2 == $dynamic.paramName) {
	            $dynamic.targetOffset = this.param2Index + this.offset;
	        }
	        else if (this.paramName3 == $dynamic.paramName) {
	            $dynamic.targetOffset = this.param3Index + this.offset;
	        }
	    }
	    setDynamicDirect($ary, $offset) {
	        this.vecNum.set($ary, $offset);
	    }
	    setDynamic($dynamic) {
	        try {
	            this.vecNum.set($dynamic.currentValue, $dynamic.targetOffset);
	        }
	        catch (err) {
	            //console.log("在此处理错误2");
	        }
	        /**
	        if (this.paramName0 == $dynamic.paramName) {
	            if (this.param0Type == 1) {
	                this.vecNum[this.param0Index + this.offset] = $dynamic.currentValue.x;
	            } else if (this.param0Type == 2) {
	                this.vecNum[this.param0Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param0Index + 1 + this.offset] = $dynamic.currentValue.y;
	            } else if (this.param0Type == 3) {
	                this.vecNum[this.param0Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param0Index + 1 + this.offset] = $dynamic.currentValue.y;
	                this.vecNum[this.param0Index + 2 + this.offset] = $dynamic.currentValue.z;
	            } else if (this.param0Type == 4) {
	                this.vecNum[this.param0Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param0Index + 1 + this.offset] = $dynamic.currentValue.y;
	                this.vecNum[this.param0Index + 2 + this.offset] = $dynamic.currentValue.z;
	                this.vecNum[this.param0Index + 3 + this.offset] = $dynamic.currentValue.w;
	            }
	        } else if (this.paramName1 == $dynamic.paramName) {
	            if (this.param1Type == 1) {
	                this.vecNum[this.param1Index + this.offset] = $dynamic.currentValue.x;
	            } else if (this.param1Type == 2) {
	                this.vecNum[this.param1Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param1Index + 1 + this.offset] = $dynamic.currentValue.y;
	            } else if (this.param1Type == 3) {
	                this.vecNum[this.param1Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param1Index + 1 + this.offset] = $dynamic.currentValue.y;
	                this.vecNum[this.param1Index + 2 + this.offset] = $dynamic.currentValue.z;
	            } else if (this.param1Type == 4) {
	                this.vecNum[this.param1Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param1Index + 1 + this.offset] = $dynamic.currentValue.y;
	                this.vecNum[this.param1Index + 2 + this.offset] = $dynamic.currentValue.z;
	                this.vecNum[this.param1Index + 3 + this.offset] = $dynamic.currentValue.w;
	            }
	        } else if (this.paramName2 == $dynamic.paramName) {
	            if (this.param2Type == 1) {
	                this.vecNum[this.param2Index + this.offset] = $dynamic.currentValue.x;
	            } else if (this.param2Type == 2) {
	                this.vecNum[this.param2Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param2Index + 1 + this.offset] = $dynamic.currentValue.y;
	            } else if (this.param2Type == 3) {
	                this.vecNum[this.param2Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param2Index + 1 + this.offset] = $dynamic.currentValue.y;
	                this.vecNum[this.param2Index + 2 + this.offset] = $dynamic.currentValue.z;
	            } else if (this.param2Type == 4) {
	                this.vecNum[this.param2Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param2Index + 1 + this.offset] = $dynamic.currentValue.y;
	                this.vecNum[this.param2Index + 2 + this.offset] = $dynamic.currentValue.z;
	                this.vecNum[this.param2Index + 3 + this.offset] = $dynamic.currentValue.w;
	            }
	        } else if (this.paramName3 == $dynamic.paramName) {
	            if (this.param3Type == 1) {
	                this.vecNum[this.param3Index + this.offset] = $dynamic.currentValue.x;
	            } else if (this.param3Type == 2) {
	                this.vecNum[this.param3Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param3Index + 1 + this.offset] = $dynamic.currentValue.y;
	            } else if (this.param3Type == 3) {
	                this.vecNum[this.param3Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param3Index + 1 + this.offset] = $dynamic.currentValue.y;
	                this.vecNum[this.param3Index + 2 + this.offset] = $dynamic.currentValue.z;
	            } else if (this.param3Type == 4) {
	                this.vecNum[this.param3Index + this.offset] = $dynamic.currentValue.x;
	                this.vecNum[this.param3Index + 1 + this.offset] = $dynamic.currentValue.y;
	                this.vecNum[this.param3Index + 2 + this.offset] = $dynamic.currentValue.z;
	                this.vecNum[this.param3Index + 3 + this.offset] = $dynamic.currentValue.w;
	            }

	        }
	         */
	    }
	}

	class Material extends ResCount {
	    constructor() {
	        super(...arguments);
	        this.texList = new Array;
	        this.constList = new Array;
	        this.killNum = 0;
	        this.writeZbuffer = true;
	        this.fogMode = 0;
	        this.fcNum = 0;
	    }
	    update(t) {
	        this.updateTime(t);
	        //this.updateCam();
	        this.updateScene();
	    }
	    updateTime(t) {
	        if (this.hasTime) {
	            this.fcData[1] = t;
	        }
	    }
	    updateCam(x, y, z) {
	        if (this.usePbr || this.fogMode == 1) {
	            var idx = this.fcIDAry[0] * 4;
	            this.fcData[0 + idx] = x;
	            this.fcData[1 + idx] = y;
	            this.fcData[2 + idx] = z;
	        }
	    }
	    updateScene() {
	        if (this.sceneNumId == Scene_data.sceneNumId) {
	            return;
	        }
	        this.sceneNumId = Scene_data.sceneNumId;
	        if (this.fogMode != 0) {
	            var idx = this.fcIDAry[1] * 4;
	            this.fcData[0 + idx] = Scene_data.fogColor[0];
	            this.fcData[1 + idx] = Scene_data.fogColor[1];
	            this.fcData[2 + idx] = Scene_data.fogColor[2];
	        }
	        if (this.scaleLightMap) {
	            var idx = this.fcIDAry[2] * 4;
	            this.fcData[0 + idx] = Scene_data.scaleLight[0];
	        }
	    }
	    initFcData() {
	        this.fcData = new Float32Array(this.fcNum * 4);
	        if (this.fcNum <= 0) {
	            return;
	        }
	        this.sceneNumId = Scene_data.sceneNumId;
	        if (this.hasTime || this.useKill || this.fogMode != 0) { //fc0
	            if (this.useKill) {
	                this.fcData[0] = this.killNum;
	            }
	            if (this.fogMode != 0) {
	                this.fcData[2] = Scene_data.fogData[0];
	                this.fcData[3] = Scene_data.fogData[1];
	            }
	        }
	        if (this.usePbr || this.fogMode == 1) {
	            var idx = this.fcIDAry[0] * 4;
	            this.fcData[0 + idx] = Scene_data.cam3D.x / 100;
	            this.fcData[1 + idx] = Scene_data.cam3D.y / 100;
	            this.fcData[2 + idx] = Scene_data.cam3D.z / 100;
	        }
	        if (this.fogMode != 0) {
	            var idx = this.fcIDAry[1] * 4;
	            this.fcData[0 + idx] = Scene_data.fogColor[0];
	            this.fcData[1 + idx] = Scene_data.fogColor[1];
	            this.fcData[2 + idx] = Scene_data.fogColor[2];
	        }
	        if (this.scaleLightMap) {
	            var idx = this.fcIDAry[2] * 4;
	            this.fcData[0 + idx] = Scene_data.scaleLight[0];
	        }
	    }
	    setCompileData(_compileData) {
	        if (!_compileData) {
	            return;
	        }
	        this.shaderStr = _compileData.shaderStr;
	        this.hasTime = _compileData.hasTime;
	        this.timeSpeed = _compileData.timeSpeed;
	        this.blendMode = _compileData.blendMode;
	        this.backCull = _compileData.backCull;
	        this.killNum = _compileData.killNum;
	        this.hasVertexColor = _compileData.hasVertexColor;
	        this.usePbr = _compileData.usePbr;
	        this.useNormal = _compileData.useNormal;
	        this.roughness = _compileData.roughness;
	        this.writeZbuffer = _compileData.writeZbuffer;
	        this.hasFresnel = _compileData.hasFresnel;
	        this.useDynamicIBL = _compileData.useDynamicIBL;
	        this.normalScale = _compileData.normalScale;
	        this.lightProbe = _compileData.lightProbe;
	        this.useKill = _compileData.useKill;
	        this.directLight = _compileData.directLight;
	        this.noLight = _compileData.noLight;
	        this.scaleLightMap = _compileData.scaleLightMap;
	        this.fogMode = _compileData.fogMode;
	        this.hasParticleColor = false;
	        this.initFcData();
	        if (_compileData.texList) {
	            var ary = _compileData.texList;
	            this.texList = new Array;
	            for (var i = 0; i < ary.length; i++) {
	                var texItem = new TexItem;
	                texItem.id = ary[i].id;
	                texItem.url = ary[i].url;
	                texItem.isDynamic = ary[i].isDynamic;
	                texItem.paramName = ary[i].paramName;
	                texItem.isMain = ary[i].isMain;
	                texItem.isParticleColor = ary[i].isParticleColor;
	                texItem.type = ary[i].type;
	                texItem.wrap = ary[i].wrap;
	                texItem.filter = ary[i].filter;
	                texItem.mipmap = ary[i].mipmap;
	                this.texList.push(texItem);
	                if (texItem.isParticleColor) {
	                    this.hasParticleColor = true;
	                }
	            }
	        }
	        if (_compileData.constList) {
	            ary = _compileData.constList;
	            this.constList = new Array;
	            for (i = 0; i < ary.length; i++) {
	                var constItem = new ConstItem;
	                constItem.setData(ary[i]);
	                constItem.creat(this.fcData);
	                this.constList.push(constItem);
	            }
	        }
	    }
	    setByteData(byte) {
	        var fs = byte;
	        var vesion = fs.readInt();
	        this.shaderStr = fs.readUTF(); //fs.writeUTF(_compileData.shaderStr)
	        this.hasTime = fs.readBoolean(); //fs.writeBoolean(_compileData.hasTime);
	        this.timeSpeed = fs.readFloat(); //fs.writeFloat(_compileData.timeSpeed);
	        this.blendMode = fs.readFloat(); //fs.writeFloat(_compileData.blendMode);
	        this.backCull = fs.readBoolean(); //fs.writeBoolean(_compileData.backCull);
	        this.killNum = fs.readFloat(); //fs.writeFloat(_compileData.killNum);
	        this.hasVertexColor = fs.readBoolean(); //fs.writeBoolean(_compileData.hasVertexColor);
	        this.usePbr = fs.readBoolean(); //fs.writeBoolean(_compileData.usePbr);
	        this.useNormal = fs.readBoolean(); //fs.writeBoolean(_compileData.useNormal);
	        this.roughness = fs.readFloat(); //fs.writeFloat(_compileData.roughness);
	        this.writeZbuffer = fs.readBoolean(); //fs.writeBoolean(_compileData.writeZbuffer);
	        this.hasFresnel = fs.readBoolean(); //fs.writeBoolean(_compileData.hasFresnel);
	        this.useDynamicIBL = fs.readBoolean(); //fs.writeBoolean(_compileData.useDynamicIBL);
	        this.normalScale = fs.readFloat(); //fs.writeFloat(_compileData.normalScale);
	        this.lightProbe = fs.readBoolean(); //fs.writeBoolean(_compileData.lightProbe);
	        this.useKill = fs.readBoolean(); //fs.writeBoolean(_compileData.useKill);
	        this.directLight = fs.readBoolean(); //fs.writeBoolean(_compileData.directLight);
	        this.noLight = fs.readBoolean(); //fs.writeBoolean(_compileData.noLight);
	        this.scaleLightMap = fs.readBoolean(); //fs.writeBoolean(_compileData.scaleLightMap)
	        if (vesion > 2) {
	            this.fogMode = fs.readInt();
	        }
	        if (vesion >= 22) {
	            this.fcNum = fs.readByte();
	            var leg = fs.readByte();
	            this.fcIDAry = new Array;
	            for (var i = 0; i < leg; i++) {
	                this.fcIDAry.push(fs.readByte());
	            }
	        }
	        this.hasParticleColor = false;
	        this.initFcData();
	        this.readTexList(fs);
	        this.readConstLis(fs);
	    }
	    readConstLis(fs) {
	        var constLisLen = fs.readInt();
	        this.constList = new Array;
	        for (var i = 0; i < constLisLen; i++) {
	            var constItem = new ConstItem;
	            constItem.id = fs.readFloat();
	            constItem.value = new Vector3D(fs.readFloat(), fs.readFloat(), fs.readFloat(), fs.readFloat());
	            constItem.paramName0 = fs.readUTF();
	            constItem.param0Type = fs.readFloat();
	            constItem.param0Index = fs.readFloat();
	            constItem.paramName1 = fs.readUTF();
	            constItem.param1Type = fs.readFloat();
	            constItem.param1Index = fs.readFloat();
	            constItem.paramName2 = fs.readUTF();
	            constItem.param2Type = fs.readFloat();
	            constItem.param2Index = fs.readFloat();
	            constItem.paramName3 = fs.readUTF();
	            constItem.param3Type = fs.readFloat();
	            constItem.param3Index = fs.readFloat();
	            constItem.creat(this.fcData);
	            this.constList.push(constItem);
	        }
	    }
	    readTexList(fs) {
	        var texListLen = fs.readInt();
	        this.texList = new Array;
	        for (var i = 0; i < texListLen; i++) {
	            var texItem = new TexItem;
	            texItem.id = fs.readFloat();
	            texItem.url = fs.readUTF();
	            texItem.isDynamic = fs.readBoolean();
	            texItem.paramName = fs.readUTF();
	            texItem.isMain = fs.readBoolean();
	            texItem.isParticleColor = fs.readBoolean();
	            texItem.type = fs.readFloat();
	            texItem.wrap = fs.readFloat();
	            texItem.filter = fs.readFloat();
	            texItem.mipmap = fs.readFloat();
	            if (texItem.isParticleColor) {
	                this.hasParticleColor = true;
	            }
	            this.texList.push(texItem);
	        }
	    }
	    destory() {
	        for (var i = 0; i < this.texList.length; i++) {
	            this.texList[i].destory();
	        }
	        this.texList = null;
	        this.constList = null;
	        if (this.shader) {
	            this.shader.clearUseNum();
	        }
	    }
	}

	class ProgramManager extends ResGC {
	    constructor() {
	        //this._dic = new Object();
	        super();
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new ProgramManager();
	        }
	        return this._instance;
	    }
	    getProgram($str) {
	        if (this._dic[$str]) {
	            return this._dic[$str];
	        }
	        else {
	            alert("please registe Program=>" + $str);
	            return null;
	        }
	    }
	    registe($str, $shader3D) {
	        if (!this._dic[$str]) {
	            $shader3D.encode();
	            $shader3D.useNum = 1;
	            $shader3D.name = $str;
	            this._dic[$str] = $shader3D;
	        }
	    }
	    getMaterialProgram(key, shaderCls, $material, paramAry = null, parmaByFragmet = false) {
	        var keyStr = key + "_" + $material.url;
	        //if (keyStr.search("/standard_byte1111") != -1 &&true) { //FIXME
	        //    //console.log(keyStr)
	        //    this.outShader($material.shaderStr)
	        //    $material.shaderStr =
	        //    "precision mediump float;\n" +
	        //    "uniform sampler2D fs0;\n" +
	        //    "uniform sampler2D fs1;\n" +
	        //    "uniform vec4 fc2;\n" +
	        //    "uniform vec2 fogdata;\n" +
	        //    "uniform vec3 fogcolor;\n" +
	        //    "varying vec2 v0;\n" +
	        //    "varying vec2 v2;\n" +
	        //    "varying vec3 v1;\n" +
	        //    "void main(void){\n" +
	        //    "\n" +
	        //    "vec4 ft0 = texture2D(fs0,v0);\n" +
	        //    "vec4 ft1 = texture2D(fs1,v2);\n" +
	        //    "ft1.xyz = ft1.xyz * 2.0;\n" +
	        //    "ft1.xyz = ft1.xyz * ft0.xyz;\n" +
	        //    "vec4 ft2 = vec4(0,0,0,1);\n" +
	        //    "ft2.xyz = ft1.xyz;\n" +
	        //    "ft2.w = 1.0;\n" +
	        //   "ft1.x = distance(v1.xyz*0.01, fc2.xyz)*100.0;\n" +
	        //   "ft1.x = ft1.x - fogdata.x;\n"+
	        //   "ft1.x = fogdata.y * ft1.x;\n" +
	        //   "ft1.x = clamp(ft1.x,0.0,1.0);\n"+
	        //   "ft2.xyz = mix(ft2.xyz,fogcolor.xyz,ft1.x);\n" +
	        //    "gl_FragColor = ft2;\n"+
	        //     "}"
	        //}
	        if (paramAry) {
	            for (var i = 0; i < paramAry.length; i++) {
	                keyStr += "_" + paramAry[i];
	            }
	            if (parmaByFragmet) {
	                keyStr += "true_";
	            }
	            else {
	                keyStr += "false_";
	            }
	        }
	        if (this._dic[keyStr]) {
	            this._dic[keyStr].useNum++;
	            return this._dic[keyStr];
	        }
	        if (parmaByFragmet) {
	            paramAry = [$material.usePbr, $material.useNormal, $material.hasFresnel,
	                $material.useDynamicIBL, $material.lightProbe, $material.directLight,
	                $material.noLight, $material.fogMode];
	        }
	        var shader = new shaderCls();
	        shader.paramAry = paramAry;
	        shader.fragment = $material.shaderStr;
	        var encodetf = shader.encode();
	        shader.useNum++;
	        //if (keyStr.search("staticstandtrans") != -1 && true) {
	        //this.outShader(shader.vertex)
	        ////console.log(shader.vertex);
	        ////console.log(shader.fragment);
	        //}
	        this._dic[keyStr] = shader;
	        return shader;
	    }
	    outShader($str) {
	        var $item = $str.split("\n");
	        //console.log("----")
	        for (var i = 0; i < $item.length; i++) {
	            var str = "\"";
	            str += $item[i];
	            if (i < ($item.length - 1)) {
	                str += "\\n";
	                str += "\"";
	                str += "\+";
	            }
	            else {
	                str += "\"";
	            }
	            //console.log(str)
	        }
	        //console.log("----")
	    }
	    gc() {
	        super.gc();
	    }
	}

	class MaterialManager extends ResGC {
	    constructor() {
	        //this._dic = new Object();
	        super();
	        this._loadDic = new Object();
	        this._resDic = new Object();
	        this._regDic = new Object();
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new MaterialManager();
	        }
	        return this._instance;
	    }
	    /**
	    public getMaterial($url: string, $fun: Function, $info: Object = null, $autoReg: boolean = false, $regName: string = null, $shader3D: Shader3D = null): void {

	        if (this._dic[$url]) {
	            if ($info) {
	                $fun(this._dic[$url], $info);
	            } else {
	                $fun(this._dic[$url]);
	            }
	            return;
	        }

	        var materialLoad: MaterialLoad = new MaterialLoad($fun, $info, $url, $autoReg, $regName, $shader3D);
	        if (this._loadDic[$url]) {
	            var ary: Array<MaterialLoad> = this._loadDic[$url];
	            ary.push(materialLoad);
	            return;
	        }

	        this._loadDic[$url] = new Array;
	        this._loadDic[$url].push(materialLoad);

	        if (this._resDic[$url]) {
	            this.loadMaterialCom(this._resDic[$url], materialLoad);
	        } else {
	            LoadManager.getInstance().load($url, LoadManager.XML_TYPE, ($data: string, _info: MaterialLoad) => { this.loadMaterialCom($data, _info) }, materialLoad);
	        }
	    }
	     */
	    getMaterialByte($url, $fun, $info = null, $autoReg = false, $regName = null, $shader3DCls = null) {
	        if (this._dic[$url]) {
	            if ($info) {
	                $fun(this._dic[$url], $info);
	            }
	            else {
	                $fun(this._dic[$url]);
	            }
	            this._dic[$url].useNum++;
	            // if ($url.indexOf("m_ef_ver_byte.txt") != -1) {
	            //     //console.log("aaaaaaaaaaaaaaaa", this._dic[$url].useNum)
	            // }
	            return;
	        }
	        var materialLoad = new MaterialLoad($fun, $info, $url, $autoReg, $regName, $shader3DCls);
	        if (this._loadDic[$url]) {
	            var ary = this._loadDic[$url];
	            ary.push(materialLoad);
	            return;
	        }
	        this._loadDic[$url] = new Array;
	        this._loadDic[$url].push(materialLoad);
	        if (this._resDic[$url]) {
	            this.meshByteMaterialByt(this._resDic[$url], materialLoad);
	            if (this._regDic[$url]) {
	                this._dic[$url].useNum += this._regDic[$url];
	                delete this._regDic[$url];
	            }
	            delete this._resDic[$url];
	        }
	        else {
	            LoadManager.getInstance().load($url, LoadManager.BYTE_TYPE, ($data, _info) => { this.loadMaterialByteCom($data, _info); }, materialLoad);
	        }
	    }
	    meshByteMaterialByt(byte, _info) {
	        var material = new Material();
	        material.setByteData(byte);
	        material.url = _info.url;
	        this.loadMaterial(material);
	        if (_info.autoReg) {
	            material.shader = ProgramManager.getInstance().getMaterialProgram(_info.regName, _info.shader3D, material, null, true);
	            material.program = material.shader.program;
	        }
	        var ary = this._loadDic[_info.url];
	        for (var i = 0; i < ary.length; i++) {
	            if (ary[i].info) {
	                ary[i].fun(material, ary[i].info);
	            }
	            else {
	                ary[i].fun(material);
	            }
	            material.useNum++;
	            // if (_info.url.indexOf("m_ef_ver_byte.txt") != -1) {
	            //     //console.log("aaaaaaaaaaaaaaaa", material.useNum)
	            // }
	        }
	        delete this._loadDic[_info.url];
	        this._dic[_info.url] = material;
	    }
	    loadMaterialByteCom($data, _info) {
	        var byte = new Pan3dByteArray($data);
	        this.meshByteMaterialByt(byte, _info);
	    }
	    addResByte($url, $data) {
	        if (!this._dic[$url] && !this._resDic[$url]) {
	            this._resDic[$url] = $data;
	        }
	    }
	    registerUrl($url) {
	        $url = $url.replace("_byte.txt", ".txt");
	        $url = $url.replace(".txt", "_byte.txt");
	        if (this._dic[$url]) {
	            this._dic[$url].useNum++;
	        }
	        else {
	            if (this._regDic[$url]) {
	                this._regDic[$url]++;
	            }
	            else {
	                this._regDic[$url] == 1;
	            }
	        }
	    }
	    releaseUrl($url) {
	        $url = $url.replace("_byte.txt", ".txt");
	        $url = $url.replace(".txt", "_byte.txt");
	        if (this._dic[$url]) {
	            this._dic[$url].clearUseNum();
	        }
	    }
	    /**
	    public loadMaterialCom($data: string, _info: MaterialLoad): void {
	        var obj = JSON.parse($data);
	        
	        var material: Material = new Material();
	        material.setCompileData(obj);
	        material.url = _info.url;

	        this.loadMaterial(material);

	        if (_info.autoReg){
	            material.program = ProgrmaManager.getInstance().getMaterialProgram(_info.regName, _info.shader3D, material, null, true);
	        }

	        var ary: Array<TextureLoad> = this._loadDic[_info.url];
	        for (var i: number = 0; i < ary.length; i++) {
	            if (ary[i].info) {
	                ary[i].fun(material, ary[i].info);
	            } else {
	                ary[i].fun(material);
	            }
	        }
	        
	        delete this._loadDic[_info.url];

	        this._dic[_info.url] = material;

	    }
	    */
	    loadMaterial($material) {
	        var texVec = $material.texList;
	        for (var i = 0; i < texVec.length; i++) {
	            if (texVec[i].isParticleColor || texVec[i].isDynamic || texVec[i].type != 0) {
	                continue;
	            }
	            TextureManager.getInstance().getTexture(Scene_data.fileRoot + texVec[i].url, ($textureVo, $texItem) => {
	                $texItem.textureRes = $textureVo;
	            }, texVec[i].wrap, texVec[i], texVec[i].filter, texVec[i].mipmap);
	        }
	    }
	    loadDynamicTexUtil(material) {
	        var dynamicTexList = material.dynamicTexList;
	        for (var i = 0; i < dynamicTexList.length; i++) {
	            if (dynamicTexList[i].isParticleColor) {
	                dynamicTexList[i].creatTextureByCurve();
	            }
	            else {
	                TextureManager.getInstance().getTexture(Scene_data.fileRoot + dynamicTexList[i].url, ($textureVo, $texItem) => {
	                    $texItem.textureRes = $textureVo;
	                }, 0, dynamicTexList[i], 0, 1);
	            }
	        }
	    }
	    gc() {
	        super.gc();
	    }
	}
	class MaterialLoad {
	    constructor($fun, $info, $url, $autoReg, $regName, $shader3D) {
	        this.fun = $fun;
	        this.info = $info;
	        this.url = $url;
	        this.autoReg = $autoReg;
	        this.regName = $regName;
	        this.shader3D = $shader3D;
	    }
	}

	class BaseEvent {
	    constructor($type) {
	        this.type = $type;
	    }
	}
	BaseEvent.COMPLETE = "complete";

	class ColorTransition {
	    constructor() {
	        this._canvas = document.createElement("canvas");
	        this._cxt = this._canvas.getContext("2d");
	        this._gnt = this._cxt.createLinearGradient(0, 0, 128, 0);
	        this._canvas.style.zIndex = "1";
	        //document.body.appendChild(this._canvas);
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new ColorTransition();
	        }
	        return this._instance;
	    }
	    getImageData($data) {
	        var length = $data.pos.length;
	        var color = new Vector3D();
	        for (var i = 0; i < length; i++) {
	            Util.hexToArgb($data.color[i], false, color);
	            this._gnt.addColorStop($data.pos[i] / 255, 'rgba(' + color.x + ',' + color.y + ',' + color.z + ',' + $data.alpha[i] + ')');
	        }
	        this._cxt.fillStyle = this._gnt;
	        this._cxt.fillRect(0, 0, 128, 2);
	        return this._cxt.getImageData(0, 0, 128, 2);
	    }
	    getImageDataByVec($data, $lenght) {
	        var imgData = this._cxt.createImageData(64, 1);
	        var index;
	        var baseindex;
	        for (var i = 0; i < 64; i++) {
	            index = i * 4;
	            baseindex = Util.float2int(i / 64 * $lenght) * 4;
	            imgData.data[index] = $data[baseindex];
	            imgData.data[index + 1] = $data[baseindex + 1];
	            imgData.data[index + 2] = $data[baseindex + 2];
	            imgData.data[index + 3] = $data[baseindex + 3];
	        }
	        return imgData;
	        //Scene_data.context3D.getTexture(imgData);
	    }
	    setData() {
	    }
	}

	class Curve {
	    constructor() {
	        this.valueV3d = [1, 1, 1, 1];
	    }
	    getValue($t) {
	        if (!this.valueVec || this.begintFrame == -1) {
	            return this.valueV3d;
	        }
	        var flag = Util.float2int($t / Scene_data.frameTime - this.begintFrame);
	        if (flag < 0) {
	            flag = 0;
	        }
	        else if (flag > this.maxFrame - this.begintFrame) {
	            flag = this.maxFrame - this.begintFrame;
	        }
	        return this.valueVec[flag];
	        /**

	        if (this.type == 1) {
	            this.valueV3d.x = this.valueVec[0][flag];
	        } else if (this.type == 2) {
	            this.valueV3d.x = this.valueVec[0][flag];
	            this.valueV3d.y = this.valueVec[1][flag];
	        } else if (this.type == 3) {
	            this.valueV3d.x = this.valueVec[0][flag];
	            this.valueV3d.y = this.valueVec[1][flag];
	            this.valueV3d.z = this.valueVec[2][flag];
	        } else if (this.type == 4) {
	            this.valueV3d.x = this.valueVec[0][flag];
	            this.valueV3d.y = this.valueVec[1][flag];
	            this.valueV3d.z = this.valueVec[2][flag];
	            this.valueV3d.w = this.valueVec[3][flag];

	            this.valueV3d.scaleBy(this.valueV3d.w);

	        }
	        return this.valueV3d;

	         */
	    }
	    setData(obj) {
	        this.type = obj.type;
	        this.maxFrame = obj.maxFrame;
	        if (obj.items.length) {
	            this.begintFrame = obj.items[0].frame;
	        }
	        else {
	            this.begintFrame = -1;
	        }
	        var len = obj.values[0].length;
	        var ary = new Array;
	        for (var i = 0; i < len; i++) {
	            var itemAry = new Array;
	            if (this.type == 1) {
	                itemAry.push(obj.values[0][i]);
	            }
	            else if (this.type == 2) {
	                itemAry.push(obj.values[0][i], obj.values[1][i]);
	            }
	            else if (this.type == 3) {
	                itemAry.push(obj.values[0][i], obj.values[1][i], obj.values[2][i]);
	            }
	            else if (this.type == 4) {
	                var w = obj.values[3][i];
	                itemAry.push(obj.values[0][i] * w, obj.values[1][i] * w, obj.values[2][i] * w, w);
	            }
	            ary.push(itemAry);
	        }
	        this.valueVec = ary;
	    }
	}

	class DynamicTexItem extends DynamicBaseTexItem {
	    constructor() {
	        super();
	    }
	    destory() {
	        super.destory();
	        if (this._textureDynamic) {
	            Scene_data.context3D.deleteTexture(this._textureDynamic);
	        }
	        //if (this.textureRes){
	        //    this.textureRes.useNum--;
	        //}
	        this.target = null;
	        //this.curve = null;
	    }
	    initCurve($type) {
	        this.curve = new Curve;
	        this.curve.type = $type;
	    }
	    get texture() {
	        if (this._textureDynamic) {
	            return this._textureDynamic;
	        }
	        else {
	            if (this.textureRes) {
	                return this.textureRes.texture;
	            }
	            else {
	                return null;
	            }
	        }
	    }
	    creatTextureByCurve() {
	        var i = 0;
	        var endVecIndex = this.curve.valueVec.length - 1;
	        var imgNumVec = new Array;
	        for (var i = 0; i < this.life; i++) {
	            if (i < this.curve.begintFrame) {
	                imgNumVec.push(this.curve.valueVec[0][0] * 0xff, this.curve.valueVec[0][1] * 0xff, this.curve.valueVec[0][2] * 0xff, this.curve.valueVec[0][3] * 0xff);
	            }
	            else if (i > this.curve.maxFrame) {
	                if (this.curve.maxFrame == 0 && this.curve.begintFrame < 0) {
	                    imgNumVec.push(0xff, 0xff, 0xff, 0xff);
	                }
	                else {
	                    imgNumVec.push(this.curve.valueVec[endVecIndex][0] * 0xff, this.curve.valueVec[endVecIndex][1] * 0xff, this.curve.valueVec[endVecIndex][2] * 0xff, this.curve.valueVec[endVecIndex][3] * 0xff);
	                }
	            }
	            else {
	                if (this.curve.begintFrame < 0) {
	                    imgNumVec.push(0xff, 0xff, 0xff, 0xff);
	                }
	                else {
	                    var index = i - this.curve.begintFrame;
	                    imgNumVec.push(this.curve.valueVec[index][0] * 0xff, this.curve.valueVec[index][1] * 0xff, this.curve.valueVec[index][2] * 0xff, this.curve.valueVec[index][3] * 0xff);
	                }
	            }
	        }
	        var img = ColorTransition.getInstance().getImageDataByVec(imgNumVec, this.life);
	        this._textureDynamic = Scene_data.context3D.getTexture(img);
	    }
	    //public argbToHex(r: Number, g: Number, b: Number, a: Number): uint {
	    //    var expColor: uint = uint(a * 0xff) << 24 | uint(r * 0xff) << 16 | uint(g * 0xff) << 8 | uint(b * 0xff);
	    //    return expColor;
	    //}
	    get life() {
	        return this._life;
	    }
	    set life(value) {
	        this._life = value;
	    }
	}

	class DynamicConstItem extends DynamicBaseConstItem {
	    update(t = 0) {
	        this.currentValue = this.curve.getValue(t);
	        this.target.setDynamic(this);
	        //this.target.setDynamicDirect(this.curve.getValue(t),this.targetOffset);
	    }
	    set type(value) {
	        this._type = value;
	        this.curve = new Curve;
	        this.curve.type = value;
	    }
	}

	class MaterialParam extends MaterialBaseParam {
	    //public dynamicTexList:Array<DynamicTexItem>;
	    //public dynamicConstList:Array<DynamicConstItem>;
	    constructor() {
	        super();
	    }
	    destory() {
	        //this.material.useNum--;
	        this.material.useNum--;
	        this.shader.useNum--;
	        // if(this.material.url.indexOf("m_ef_ver_byte.txt") != -1){
	        //     //console.log("bbbbbbbbbbbbbbbbbbb",this.material.useNum)
	        // }
	        //for (var i: number = 0; i < this.dynamicTexList.length; i++){
	        //    this.dynamicTexList[i].destory();
	        //}
	        //this.dynamicTexList = null;
	        //this.dynamicConstList = null;
	        super.destory();
	    }
	    setMaterial($materialTree) {
	        this.material = $materialTree;
	        this.materialUrl = $materialTree.url;
	        this.dynamicTexList = new Array;
	        this.dynamicConstList = new Array;
	        this.setTexList();
	        this.setConstList();
	    }
	    setLife($life) {
	        for (var i = 0; i < this.dynamicTexList.length; i++) {
	            if (this.dynamicTexList[i].isParticleColor) {
	                this.dynamicTexList[i].life = $life;
	            }
	        }
	    }
	    setTexList() {
	        var texList = this.material.texList;
	        for (var i = 0; i < texList.length; i++) {
	            var dyTex;
	            if (texList[i].isParticleColor) {
	                dyTex = new DynamicTexItem;
	                dyTex.target = texList[i];
	                dyTex.paramName = texList[i].paramName;
	                dyTex.initCurve(4);
	                this.dynamicTexList.push(dyTex);
	                dyTex.isParticleColor = true;
	            }
	            else if (texList[i].isDynamic) {
	                dyTex = new DynamicTexItem;
	                dyTex.target = texList[i];
	                dyTex.paramName = texList[i].paramName;
	                this.dynamicTexList.push(dyTex);
	            }
	        }
	    }
	    setConstList() {
	        var constList = this.material.constList;
	        for (var i = 0; i < constList.length; i++) {
	            var constItem = constList[i];
	            var dyCon;
	            if (constItem.param0Type != 0) {
	                dyCon = new DynamicConstItem;
	                // dyCon.target = constItem;
	                // dyCon.paramName = constItem.paramName0;
	                // dyCon.type = constItem.param0Type;
	                dyCon.setTargetInfo(constItem, constItem.paramName0, constItem.param0Type);
	                this.dynamicConstList.push(dyCon);
	            }
	            if (constItem.param1Type != 0) {
	                dyCon = new DynamicConstItem;
	                // dyCon.target = constItem;
	                // dyCon.paramName = constItem.paramName1;
	                // dyCon.type = constItem.param1Type;
	                dyCon.setTargetInfo(constItem, constItem.paramName1, constItem.param1Type);
	                this.dynamicConstList.push(dyCon);
	            }
	            if (constItem.param2Type != 0) {
	                dyCon = new DynamicConstItem;
	                // dyCon.target = constItem;
	                // dyCon.paramName = constItem.paramName2;
	                // dyCon.type = constItem.param2Type;
	                dyCon.setTargetInfo(constItem, constItem.paramName2, constItem.param2Type);
	                this.dynamicConstList.push(dyCon);
	            }
	            if (constItem.param3Type != 0) {
	                dyCon = new DynamicConstItem;
	                // dyCon.target = constItem;
	                // dyCon.paramName = constItem.paramName3;
	                // dyCon.type = constItem.param3Type;
	                dyCon.setTargetInfo(constItem, constItem.paramName3, constItem.param3Type);
	                this.dynamicConstList.push(dyCon);
	            }
	        }
	    }
	    setTextObj(ary) {
	        for (var i = 0; i < ary.length; i++) {
	            var obj = ary[i];
	            for (var j = 0; j < this.dynamicTexList.length; j++) {
	                if (this.dynamicTexList[j].paramName == obj.paramName) {
	                    if (this.dynamicTexList[j].isParticleColor) {
	                        this.dynamicTexList[j].curve.setData(obj.curve);
	                    }
	                    else {
	                        this.dynamicTexList[j].url = obj.url;
	                    }
	                    break;
	                }
	            }
	        }
	    }
	    setConstObj(ary) {
	        for (var i = 0; i < ary.length; i++) {
	            var obj = ary[i];
	            for (var j = 0; j < this.dynamicConstList.length; j++) {
	                if (this.dynamicConstList[j].paramName == obj.paramName) {
	                    this.dynamicConstList[j].curve.setData(obj.curve);
	                    break;
	                }
	            }
	        }
	    }
	    /**
	     * 贴图是否准备完成
	     */
	    isTexReady() {
	        var texDynamicVec = this.dynamicTexList;
	        for (var i = 0; i < texDynamicVec.length; i++) {
	            if (!texDynamicVec[i].texture)
	                return false;
	        }
	        return true;
	    }
	}

	class TimeLineData {
	    constructor() {
	        this.dataAry = new Array;
	    }
	    destory() {
	        this.dataAry = null;
	    }
	    setByteData($byte) {
	        var len = $byte.readFloat();
	        for (var i = 0; i < len; i++) {
	            var frameNum = $byte.readFloat();
	            var key = this.addKeyFrame(frameNum);
	            key.frameNum = frameNum;
	            key.baseValue = new Array();
	            for (var j = 0; j < 10; j++) {
	                key.baseValue.push($byte.readFloat());
	            }
	            var animLen = $byte.readFloat();
	            key.animData = new Array;
	            if (animLen > 0) {
	                for (var k = 0; k < animLen; k++) {
	                    key.animData.push(this.getByteDataTemp($byte));
	                }
	            }
	        }
	        this.maxFrameNum = this.dataAry[this.dataAry.length - 1].frameNum;
	        this.beginTime = this.dataAry[0].frameNum * Scene_data.frameTime;
	    }
	    addKeyFrame(num) {
	        var keyframe = new Object();
	        keyframe.frameNum = num;
	        this.dataAry.push(keyframe);
	        return keyframe;
	    }
	    getByteDataTemp($byte) {
	        var obj = new Object;
	        var animType = $byte.readInt();
	        var dataLen = $byte.readInt();
	        obj.data = new Array;
	        obj.dataByte = new Array;
	        for (var i = 0; i < dataLen; i++) {
	            var ko = new Object;
	            ko.type = $byte.readInt();
	            //  ko.value = $byte.readUTF();
	            // obj.data.push(ko);
	            if (ko.type == 1) {
	                var num = $byte.readFloat();
	                obj.dataByte.push(num);
	            }
	            if (ko.type == 2) {
	                var v = new Vector3D();
	                v.x = $byte.readFloat();
	                v.y = $byte.readFloat();
	                v.z = $byte.readFloat();
	                obj.dataByte.push(v);
	            }
	        }
	        obj.type = animType;
	        return obj;
	    }
	}

	class KeyFrame {
	    constructor() {
	    }
	}

	class BaseAnim {
	    constructor() {
	        this.baseNum = 0;
	        this.num = 0;
	        this.time = 0;
	        this.speed = 0;
	        this.aSpeed = 0;
	        this.beginTime = 0;
	        this.lastTime = 0;
	        this.baseTime = 0;
	    }
	    BaseAnim() {
	    }
	    update(t) {
	        if (this._isDeath) {
	            return;
	        }
	        this.time = t - this.baseTime;
	        if (this._isActiva) {
	            this.time = this.time - this.beginTime;
	            if (this.time > this.lastTime) {
	                this.time = this.lastTime - this.beginTime;
	                this._isDeath = true;
	            }
	            this.coreCalculate();
	        }
	        else {
	            if (this.time >= this.beginTime) {
	                if (this.time >= this.lastTime) {
	                    this.time = this.lastTime - this.beginTime;
	                    this.coreCalculate();
	                    this._isDeath = true;
	                }
	                else {
	                    this.time = this.time - this.beginTime;
	                    this.coreCalculate();
	                }
	                this._isActiva = true;
	            }
	        }
	    }
	    coreCalculate() {
	        this.num = this.speed * this.time + this.aSpeed * this.time * this.time + this.baseNum;
	    }
	    reset() {
	        this._isActiva = false;
	        this._isDeath = false;
	        //time = 0;
	        //baseNum = num;
	        this.time = 0;
	        this.num = 0;
	    }
	    depthReset() {
	        this._isActiva = false;
	        this._isDeath = false;
	        this.time = 0;
	        this.baseNum = 0;
	        this.num = 0;
	    }
	    set data(value) {
	    }
	    get isDeath() {
	        return this._isDeath;
	    }
	    set isDeath(value) {
	        this._isDeath = value;
	    }
	    getAllNum(allTime) {
	        allTime = Math.min(allTime, this.lastTime);
	        allTime = allTime - this.beginTime;
	        var num = this.speed * allTime + this.aSpeed * allTime * allTime;
	        this.baseNum += num;
	    }
	}

	class SelfRotation extends BaseAnim {
	    set data(value) {
	        this.beginTime = Number(value[0].value);
	        if (Number(value[1].value) == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = Number(value[1].value);
	        }
	        this.speed = Number(value[2].value) * 0.1;
	        this.aSpeed = Number(value[3].value) * 0.1;
	    }
	    dataByte(va, arr) {
	        this.beginTime = arr[0];
	        if (arr[1] == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = arr[1];
	        }
	        this.speed = arr[2] * 0.1;
	        this.aSpeed = arr[3] * 0.1;
	    }
	}

	class AxisRotaion extends BaseAnim {
	    set data(value) {
	        this.beginTime = Number(value[0].value);
	        if (Number(value[1].value) == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = Number(value[1].value);
	        }
	        var vc = String(value[2].value).split("|");
	        this.axis = new Vector3D(Number(vc[0]), Number(vc[1]), Number(vc[2]));
	        vc = String(value[3].value).split("|");
	        this.axisPos = new Vector3D(Number(vc[0]) * 100, Number(vc[1]) * 100, Number(vc[2]) * 100);
	        this.speed = Number(value[4].value) * 0.1;
	        this.aSpeed = Number(value[5].value) * 0.1;
	    }
	    dataByte(va, arr) {
	        this.beginTime = Number(arr[0]);
	        if (Number(arr[1]) == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = Number(arr[1]);
	        }
	        this.axis = arr[2];
	        this.axisPos = arr[3];
	        this.speed = arr[4] * 0.1;
	        this.aSpeed = arr[5] * 0.1;
	    }
	}

	class AxisMove extends BaseAnim {
	    set data(value) {
	        this.beginTime = Number(value[0].value);
	        if (Number(value[1].value) == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = Number(value[1].value);
	        }
	        var vc = (value[2].value).split("|");
	        this.axis = new Vector3D(Number(vc[0]), Number(vc[1]), Number(vc[2]));
	        this.axis.normalize();
	        this.speed = Number(value[3].value) * 0.1;
	        this.aSpeed = Number(value[4].value) * 0.001;
	    }
	    dataByte(va, arr) {
	        this.beginTime = arr[0];
	        if (arr[1] == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = arr[1];
	        }
	        this.axis = arr[2];
	        this.axis.normalize();
	        this.speed = arr[3] * 0.1;
	        this.aSpeed = arr[4] * 0.001;
	    }
	}

	class ScaleChange extends BaseAnim {
	    constructor() {
	        super();
	        this.num = 1;
	    }
	    coreCalculate() {
	        this.num = 1 + this.speed * this.time + this.baseNum;
	        if (this.num < this.minNum) {
	            this.num = this.minNum;
	        }
	        else if (this.num > this.maxNum) {
	            this.num = this.maxNum;
	        }
	    }
	    /**
	     *
	     * @param value
	     *
	     */
	    set data(value) {
	        this.beginTime = Number(value[0].value);
	        if (Number(value[1].value) == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = Number(value[1].value);
	        }
	        this.speed = Number(value[2].value) * 0.001;
	        this.minNum = Number(value[3].value) * 0.01;
	        this.maxNum = Number(value[4].value) * 0.01;
	    }
	    dataByte(va, arr) {
	        this.beginTime = arr[0];
	        if (arr[1] == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = arr[1];
	        }
	        this.speed = arr[2] * 0.001;
	        this.minNum = arr[3] * 0.01;
	        this.maxNum = arr[4] * 0.01;
	    }
	    getAllNum(allTime) {
	        allTime = Math.min(allTime, this.lastTime);
	        allTime = allTime - this.beginTime;
	        var num = this.speed * allTime;
	        this.baseNum += num;
	        if (this.baseNum < this.minNum) {
	            this.baseNum = this.minNum;
	        }
	        else if (num > this.maxNum) {
	            this.baseNum = this.maxNum;
	        }
	    }
	    reset() {
	        this._isActiva = false;
	        this._isDeath = false;
	        this.time = 0;
	        this.num = 1;
	    }
	    depthReset() {
	        this._isActiva = false;
	        this._isDeath = false;
	        this.time = 0;
	        this.baseNum = 0;
	        this.num = 1;
	    }
	}

	class ScaleAnim extends BaseAnim {
	    constructor() {
	        super();
	        this.num = 1;
	    }
	    update(t) {
	        if (this._isDeath) {
	            return;
	        }
	        this.time = t - this.baseTime;
	        if (this._isActiva) {
	            this.coreCalculate();
	            if (this.time > this.lastTime) {
	                this._isDeath = true;
	            }
	        }
	        else {
	            if (this.time >= this.beginTime) {
	                //this.time = this.time-this.beginTime;
	                this._isActiva = true;
	            }
	        }
	    }
	    coreCalculate() {
	        var frameNum = Util.float2int(this.time / Scene_data.frameTime);
	        if (frameNum >= this.numAry.length) {
	            this.num = this.numAry[this.numAry.length - 1];
	        }
	        else {
	            this.num = this.numAry[frameNum];
	        }
	    }
	    reset() {
	        super.reset();
	        this.num = 1;
	    }
	    depthReset() {
	        super.depthReset();
	        this.num = 1;
	    }
	    set data(value) {
	        this.numAry = new Array;
	        this.beginTime = Number(value[0].value);
	        if (Number(value[1].value) == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = Number(value[1].value);
	        }
	        this.beginScale = Number(value[2].value);
	        this.scaleNum = Number(value[3].value);
	        this.scaleAry = new Array;
	        var addTime = 0;
	        for (var i = 4; i < 4 + this.scaleNum * 2; i += 2) {
	            var obj = new Object;
	            obj.value = Number(value[i].value);
	            obj.time = Number(value[i + 1].value);
	            addTime += obj.time;
	            obj.beginTime = this.beginTime + addTime;
	            this.scaleAry.push(obj);
	        }
	        var frameNum;
	        var btime = 0;
	        var aTime = 1;
	        if (this.scaleAry.length) {
	            frameNum = (this.scaleAry[this.scaleAry.length - 1].beginTime + this.scaleAry[this.scaleAry.length - 1].time) / Scene_data.frameTime;
	            aTime = this.scaleAry[0].beginTime;
	            this._currentTarget = this.scaleAry[0];
	        }
	        else {
	            frameNum = 0;
	        }
	        var flag = 0;
	        for (i = 0; i < frameNum; i++) {
	            var ctime = Scene_data.frameTime * i;
	            if (ctime >= this._currentTarget.beginTime) {
	                this.beginScale = this._currentTarget.value;
	                btime = this._currentTarget.beginTime;
	                if (flag == this.scaleAry.length - 1) {
	                    this._currentTarget = this.scaleAry[this.scaleAry.length - 1];
	                }
	                else {
	                    flag++;
	                    this._currentTarget = this.scaleAry[flag];
	                }
	                aTime = this._currentTarget.time;
	            }
	            var cNum = (ctime - btime) / aTime * (this._currentTarget.value - this.beginScale) + this.beginScale;
	            this.numAry.push(cNum);
	        }
	        this._currentTarget = this.scaleAry[0];
	    }
	    dataByte(va, arr) {
	        this.numAry = new Array;
	        this.beginTime = arr[0];
	        if (arr[1] == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = arr[1];
	        }
	        this.beginScale = arr[2];
	        this.scaleNum = arr[3];
	        this.scaleAry = new Array;
	        var addTime = 0;
	        for (var i = 4; i < 4 + this.scaleNum * 2; i += 2) {
	            var obj = new Object;
	            obj.value = arr[i];
	            obj.time = arr[i + 1];
	            addTime += obj.time;
	            obj.beginTime = this.beginTime + addTime;
	            this.scaleAry.push(obj);
	        }
	        var frameNum;
	        var btime = 0;
	        var aTime = 1;
	        if (this.scaleAry.length) {
	            frameNum = (this.scaleAry[this.scaleAry.length - 1].beginTime + this.scaleAry[this.scaleAry.length - 1].time) / Scene_data.frameTime;
	            aTime = this.scaleAry[0].beginTime;
	            this._currentTarget = this.scaleAry[0];
	        }
	        else {
	            frameNum = 0;
	        }
	        var flag = 0;
	        for (i = 0; i < frameNum; i++) {
	            var ctime = Scene_data.frameTime * i;
	            if (ctime >= this._currentTarget.beginTime) {
	                this.beginScale = this._currentTarget.value;
	                btime = this._currentTarget.beginTime;
	                if (flag == this.scaleAry.length - 1) {
	                    this._currentTarget = this.scaleAry[this.scaleAry.length - 1];
	                }
	                else {
	                    flag++;
	                    this._currentTarget = this.scaleAry[flag];
	                }
	                aTime = this._currentTarget.time;
	            }
	            var cNum = (ctime - btime) / aTime * (this._currentTarget.value - this.beginScale) + this.beginScale;
	            this.numAry.push(cNum);
	        }
	        this._currentTarget = this.scaleAry[0];
	    }
	    getAllNum(allTime) {
	        allTime = Math.min(allTime, this.lastTime + this.beginTime);
	        var target = this.scaleAry[this.scaleAry.length - 1];
	        if (allTime >= (target.beginTime + target.time)) {
	            this.baseNum = target.value;
	            return;
	        }
	        var flag;
	        for (var i = 0; i < this.scaleAry.length; i++) {
	            if (allTime > this.scaleAry[i].this.beginTime) {
	                this._currentTarget = this.scaleAry[i];
	                this.beginTime = this._currentTarget.this.beginTime;
	                this.beginScale = this._currentTarget.value;
	                flag = i;
	            }
	        }
	        flag++;
	        this._currentTarget = this.scaleAry[flag];
	        this.baseNum = (this._currentTarget.value - this.beginScale) / this._currentTarget.this.time * (allTime - this.beginTime) + this.beginScale;
	    }
	}

	class ScaleNoise extends BaseAnim {
	    coreCalculate() {
	        this.num = this.amplitude + this.amplitude * Math.sin(this.speed * this.time);
	    }
	    set data(value) {
	        this.beginTime = Number(value[0].value);
	        if (Number(value[1].value) == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = Number(value[1].value);
	        }
	        this.amplitude = Number(value[2].value);
	        this.speed = Number(value[3].value) * 0.01;
	    }
	    dataByte(va, arr) {
	        this.beginTime = arr[0];
	        if (arr[1] == -1) {
	            this.lastTime = Scene_data.MAX_NUMBER;
	        }
	        else {
	            this.lastTime = arr[1];
	        }
	        this.amplitude = arr[2];
	        this.speed = arr[3] * 0.01;
	    }
	    getAllNum(allTime) {
	        this.baseNum = this.amplitude + this.amplitude * Math.sin(this.speed * allTime);
	    }
	}

	class TimeLine extends EventDispatcher {
	    constructor() {
	        super();
	        this._time = 0; //播放时间
	        this.targetFlag = -1;
	        this.beginTime = 0;
	        this.isByteData = false;
	        this.targetFlag = -1;
	        this.visible = false;
	        this.maxFrameNum = 0;
	        this._time = 0;
	        this._keyFrameAry = new Array;
	    }
	    updateMatrix(posMatrix, $particle) {
	        if (this._axisMove) {
	            posMatrix.prependTranslation(this._axisMove.axis.x * this._axisMove.num, this._axisMove.axis.y * this._axisMove.num, this._axisMove.axis.z * this._axisMove.num);
	        }
	        if (this._axisRotaion) {
	            posMatrix.prependRotation(this._axisRotaion.num, this._axisRotaion.axis);
	        }
	        posMatrix.prependTranslation($particle.data.center.x, $particle.data.center.y, $particle.data.center.z);
	        if (this._scaleChange) {
	            //processScale();
	            posMatrix.prependScale($particle.data._widthFixed ? 1 : this._scaleChange.num, $particle.data._heightFixed ? 1 : this._scaleChange.num, $particle.data._widthFixed ? 1 : this._scaleChange.num);
	        }
	        else if (this._scaleNosie) {
	            //processNosie();
	            posMatrix.prependScale($particle.data._widthFixed ? 1 : (1 + this._scaleNosie.num), $particle.data._heightFixed ? 1 : (1 + this._scaleNosie.num), $particle.data._widthFixed ? 1 : (1 + this._scaleNosie.num));
	        }
	        else if (this._scaleAnim) {
	            //processScaleAnim();
	            posMatrix.prependScale($particle.data._widthFixed ? 1 : this._scaleAnim.num, $particle.data._heightFixed ? 1 : this._scaleAnim.num, $particle.data._widthFixed ? 1 : this._scaleAnim.num);
	            ////console.log(this._scaleAnim.num);
	        }
	        posMatrix.prependRotation($particle.data.rotationV3d.z, Vector3D.Z_AXIS);
	        posMatrix.prependRotation($particle.data.rotationV3d.y, Vector3D.Y_AXIS);
	        posMatrix.prependRotation($particle.data.rotationV3d.x, Vector3D.X_AXIS);
	    }
	    inverAxisRotation($targetMatrix) {
	        if (this._axisRotaion) {
	            $targetMatrix.prependRotation(-this._axisRotaion.num, this._axisRotaion.axis);
	        }
	    }
	    applySelfRotation($targetMatrix, $axis) {
	        if (this._selfRotaion) {
	            $targetMatrix.prependRotation(this._selfRotaion.num, $axis);
	        }
	    }
	    addKeyFrame(num) {
	        var keyframe = new KeyFrame();
	        keyframe.frameNum = num;
	        this._keyFrameAry.push(keyframe);
	        return keyframe;
	    }
	    updateTime(t) {
	        if (!this._currentKeyFrame) {
	            return;
	        }
	        this._time = t;
	        this.getTarget();
	        if (this._axisRotaion) {
	            this._axisRotaion.update(this._time);
	        }
	        if (this._selfRotaion) {
	            this._selfRotaion.update(this._time);
	        }
	        if (this._axisMove) {
	            this._axisMove.update(this._time);
	        }
	        if (this._scaleChange) {
	            this._scaleChange.update(this._time);
	        }
	        else if (this._scaleNosie) {
	            this._scaleNosie.update(this._time);
	        }
	        else if (this._scaleAnim) {
	            this._scaleAnim.update(this._time);
	        }
	    }
	    getTarget() {
	        var flag = -1;
	        for (var i = 0; i < this._keyFrameAry.length; i++) {
	            if (this._keyFrameAry[i].frameNum * Scene_data.frameTime < this._time) {
	                flag = i;
	            }
	            else {
	                break;
	            }
	        }
	        if (flag != this.targetFlag) {
	            this._currentKeyFrame = this._keyFrameAry[flag];
	            this.targetFlag = flag;
	            if (flag >= (this._keyFrameAry.length - 1) || !this._currentKeyFrame) {
	                this.visible = false;
	                this._currentKeyFrame = null;
	            }
	            else {
	                this.visible = true;
	                this.enterKeyFrame(this._currentKeyFrame.animData, this._currentKeyFrame.frameNum * Scene_data.frameTime, this._currentKeyFrame.baseValue);
	            }
	        }
	    }
	    enterKeyFrame(ary, baseTime = 0, baseValueAry = null) {
	        if (baseValueAry == null) {
	            return;
	        }
	        for (var i = 0; i < 10; i++) {
	            if (!baseValueAry[i]) {
	                continue;
	            }
	            switch (i) {
	                case 1:
	                    if (!this._selfRotaion)
	                        this._selfRotaion = new SelfRotation;
	                    this._selfRotaion.num = this._selfRotaion.baseNum = baseValueAry[i];
	                    break;
	                case 2:
	                    if (!this._axisRotaion)
	                        this._axisRotaion = new AxisRotaion;
	                    this._axisRotaion.num = this._axisRotaion.baseNum = baseValueAry[i];
	                    break;
	                case 6:
	                    if (!this._scaleChange)
	                        this._scaleChange = new ScaleChange;
	                    this._scaleChange.num = this._scaleChange.baseNum = baseValueAry[i];
	                    break;
	                case 7:
	                    if (!this._scaleAnim)
	                        this._scaleAnim = new ScaleAnim;
	                    this._scaleAnim.num = this._scaleAnim.baseNum = baseValueAry[i];
	                    break;
	                case 8:
	                    if (!this._scaleNosie)
	                        this._scaleNosie = new ScaleNoise;
	                    this._scaleNosie.num = this._scaleNosie.baseNum = baseValueAry[i];
	                    break;
	                case 9:
	                    if (!this._axisMove)
	                        this._axisMove = new AxisMove;
	                    this._axisMove.num = this._axisMove.baseNum = baseValueAry[i];
	                    break;
	            }
	        }
	        if (this._selfRotaion)
	            this._selfRotaion.isDeath = true;
	        if (this._axisRotaion)
	            this._axisRotaion.isDeath = true;
	        if (this._scaleChange)
	            this._scaleChange.isDeath = true;
	        if (this._scaleAnim)
	            this._scaleAnim.isDeath = true;
	        if (this._scaleNosie)
	            this._scaleNosie.isDeath = true;
	        if (this._axisMove)
	            this._axisMove.isDeath = true;
	        if (!ary) {
	            return;
	        }
	        this.setBaseTimeByte(ary, baseTime, baseValueAry);
	    }
	    reset() {
	        this._time = 0;
	        this._currentKeyFrame = this._keyFrameAry[0];
	        this.visible = false;
	        this.targetFlag = -1;
	    }
	    setAllByteInfo($byte, $allObj) {
	        this.isByteData = true;
	        var len = $byte.readFloat();
	        for (var i = 0; i < len; i++) {
	            var frameNum = $byte.readFloat();
	            var key = this.addKeyFrame(frameNum);
	            key.frameNum = frameNum;
	            key.baseValue = new Array();
	            for (var j = 0; j < 10; j++) {
	                key.baseValue.push($byte.readFloat());
	            }
	            var animLen = $byte.readFloat();
	            key.animData = new Array;
	            if (animLen > 0) {
	                for (var k = 0; k < animLen; k++) {
	                    key.animData.push(this.getByteDataTemp($byte));
	                }
	            }
	        }
	        this.maxFrameNum = this._keyFrameAry[this._keyFrameAry.length - 1].frameNum;
	        this.beginTime = this._keyFrameAry[0].frameNum * Scene_data.frameTime;
	        this._currentKeyFrame = this._keyFrameAry[0];
	    }
	    setAllDataInfo($data) {
	        this.isByteData = true;
	        var len = $data.dataAry.length;
	        for (var i = 0; i < len; i++) {
	            var key = this.addKeyFrame($data.dataAry[i].frameNum);
	            key.baseValue = $data.dataAry[i].baseValue;
	            key.animData = $data.dataAry[i].animData;
	        }
	        this.maxFrameNum = $data.maxFrameNum;
	        this.beginTime = $data.beginTime;
	        this._currentKeyFrame = this._keyFrameAry[0];
	    }
	    setBaseTimeByte(ary, baseTime = 0, baseValueAry = null) {
	        for (var i = 0; i < ary.length; i++) {
	            if (ary[i].type == 1) {
	                if (!this._selfRotaion) {
	                    this._selfRotaion = new SelfRotation;
	                }
	                else {
	                    this._selfRotaion.reset();
	                }
	                // this._selfRotaion.data = (ary[i].data);
	                this._selfRotaion.dataByte(ary[i].data, ary[i].dataByte);
	                this._selfRotaion.baseTime = baseTime;
	            }
	            else if (ary[i].type == 2) {
	                if (!this._axisRotaion) {
	                    this._axisRotaion = new AxisRotaion;
	                }
	                else {
	                    this._axisRotaion.reset();
	                }
	                this._axisRotaion.dataByte(ary[i].data, ary[i].dataByte);
	                this._axisRotaion.baseTime = baseTime;
	            }
	            else if (ary[i].type == 6) {
	                if (!this._scaleChange) {
	                    this._scaleChange = new ScaleChange;
	                }
	                else {
	                    this._scaleChange.reset();
	                }
	                //this._scaleChange.data = (ary[i].data);
	                this._scaleChange.dataByte(ary[i].data, ary[i].dataByte);
	                this._scaleChange.baseTime = baseTime;
	            }
	            else if (ary[i].type == 7) {
	                if (!this._scaleAnim) {
	                    this._scaleAnim = new ScaleAnim;
	                }
	                else {
	                    this._scaleAnim.reset();
	                }
	                // this._scaleAnim.data = (ary[i].data);
	                this._scaleAnim.dataByte(ary[i].data, ary[i].dataByte);
	                this._scaleAnim.baseTime = baseTime;
	            }
	            else if (ary[i].type == 8) {
	                if (!this._scaleNosie) {
	                    this._scaleNosie = new ScaleNoise;
	                }
	                else {
	                    this._scaleNosie.reset();
	                }
	                //this._scaleNosie.data = (ary[i].data);
	                this._scaleNosie.dataByte(ary[i].data, ary[i].dataByte);
	                this._scaleNosie.baseTime = baseTime;
	            }
	            else if (ary[i].type == 9) {
	                if (!this._axisMove) {
	                    this._axisMove = new AxisMove;
	                }
	                else {
	                    this._axisMove.reset();
	                }
	                // this._axisMove.data = (ary[i].data);
	                this._axisMove.dataByte(ary[i].data, ary[i].dataByte);
	                this._axisMove.baseTime = baseTime;
	            }
	        }
	    }
	    getByteDataTemp($byte) {
	        var obj = new Object;
	        var animType = $byte.readInt();
	        var dataLen = $byte.readInt();
	        obj.data = new Array;
	        obj.dataByte = new Array;
	        for (var i = 0; i < dataLen; i++) {
	            var ko = new Object;
	            ko.type = $byte.readInt();
	            //  ko.value = $byte.readUTF();
	            // obj.data.push(ko);
	            if (ko.type == 1) {
	                var num = $byte.readFloat();
	                obj.dataByte.push(num);
	            }
	            if (ko.type == 2) {
	                var v = new Vector3D();
	                v.x = $byte.readFloat();
	                v.y = $byte.readFloat();
	                v.z = $byte.readFloat();
	                obj.dataByte.push(v);
	            }
	        }
	        obj.type = animType;
	        return obj;
	    }
	    /**
	     * 获取最大的帧数
	     * @return 最大帧数
	     *
	     */
	    getMaxFrame() {
	        return this._keyFrameAry[this._keyFrameAry.length - 1].frameNum;
	    }
	    dispose() {
	        //this._keyFrameAry = null;
	        //this._display3D.clear();
	        //this._display3D = null;
	        //this._currentKeyFrame = null;
	    }
	}

	class ParticleData {
	    constructor() {
	        this._delayedTime = 0;
	        this._width = 100; //宽度
	        this._height = 100; //高度
	        this._originWidthScale = 0.5; //原点宽度比例
	        this._originHeightScale = 0.5; //原点高度比例
	        this._eyeDistance = 0; //距离视点距离
	        this._watchEye = false; //是否面向视点
	        this._isZiZhuan = false;
	        this.overAllScale = 1;
	    }
	    //public vcData:Float32Array;
	    destory() {
	        if (this.objData) {
	            this.objData.destory();
	        }
	        this.materialParam.destory();
	        this.timelineData.destory();
	        this.timelineData = null;
	    }
	    uploadGpu() {
	    }
	    regShader() {
	    }
	    initVcData() {
	    }
	    creatPartilce() {
	        var particle = this.getParticle();
	        particle.data = this;
	        var tl = new TimeLine();
	        tl.setAllDataInfo(this.timelineData);
	        particle.setTimeLine(tl);
	        particle.onCreated();
	        return particle;
	    }
	    getParticle() {
	        return null;
	    }
	    setAllByteInfo($byte) {
	        this.timelineData = new TimeLineData();
	        this.timelineData.setByteData($byte);
	        this._beginTime = this.timelineData.beginTime;
	        if (this.version >= 15) {
	            this._delayedTime = $byte.readFloat();
	        }
	        this._width = $byte.readFloat();
	        this._height = $byte.readFloat();
	        this._widthFixed = $byte.readBoolean();
	        this._heightFixed = $byte.readBoolean();
	        this._originWidthScale = $byte.readFloat();
	        this._originHeightScale = $byte.readFloat();
	        this._eyeDistance = $byte.readFloat();
	        this._alphaMode = $byte.readFloat();
	        this._uSpeed = $byte.readFloat();
	        this._vSpeed = $byte.readFloat();
	        this._animLine = $byte.readFloat();
	        this._animRow = $byte.readFloat();
	        this._animInterval = $byte.readFloat();
	        this._renderPriority = $byte.readFloat();
	        this._distortion = $byte.readBoolean();
	        this._isUV = $byte.readBoolean();
	        this._isU = $byte.readBoolean();
	        this._isV = $byte.readBoolean();
	        this._life = $byte.readFloat();
	        this._life = this._life > 10000 ? Scene_data.MAX_NUMBER : this._life;
	        this._watchEye = $byte.readBoolean();
	        this._ziZhuanAngly = new Vector3D();
	        this._ziZhuanAngly.x = $byte.readFloat();
	        this._ziZhuanAngly.y = $byte.readFloat();
	        this._ziZhuanAngly.z = $byte.readFloat();
	        this._ziZhuanAngly.w = $byte.readFloat();
	        this.rotationV3d = new Vector3D;
	        this.rotationV3d.x = $byte.readFloat();
	        this.rotationV3d.y = $byte.readFloat();
	        this.rotationV3d.z = $byte.readFloat();
	        this.center = new Vector3D();
	        this.center.x = $byte.readFloat();
	        this.center.y = $byte.readFloat();
	        this.center.z = $byte.readFloat();
	        this.center.w = $byte.readFloat();
	        this.overAllScale = $byte.readFloat();
	        //var materialParamStr: string = $byte.readUTF();
	        //this.materialParamData = JSON.parse(materialParamStr);
	        if (this._ziZhuanAngly && (this._ziZhuanAngly.x != 0 || this._ziZhuanAngly.y != 0 || this._ziZhuanAngly.z != 0)) {
	            this._isZiZhuan = true;
	        }
	        this.readMaterialPara($byte);
	        var strMaterialUrl = $byte.readUTF();
	        strMaterialUrl = strMaterialUrl.replace("_byte.txt", ".txt");
	        strMaterialUrl = strMaterialUrl.replace(".txt", "_byte.txt");
	        this.materialByteUrl = strMaterialUrl;
	    }
	    set materialByteUrl(value) {
	        if (this._materialUrl == value) {
	            return;
	        }
	        this._materialUrl = value;
	        MaterialManager.getInstance().getMaterialByte(Scene_data.fileRoot + value, ($matrial) => { this.onMaterialLoad($matrial); });
	    }
	    onMaterialLoad($matrial) {
	        this.materialParam = new MaterialParam;
	        this.materialParam.setMaterial($matrial);
	        this.materialParam.setLife(this._life);
	        if (this.materialParamData) {
	            this.materialParam.setTextObj(this.materialParamData.texAry);
	            this.materialParam.setConstObj(this.materialParamData.conAry);
	        }
	        MaterialManager.getInstance().loadDynamicTexUtil(this.materialParam);
	        this.regShader();
	    }
	    readMaterialPara($byte) {
	        this.materialParamData = new Object();
	        var $materlUrl = $byte.readUTF();
	        //  this.materialParamData.materialUrl = materialUrl;
	        var texAryLen = $byte.readInt();
	        this.materialParamData.texAry = new Array;
	        for (var i = 0; i < texAryLen; i++) {
	            var temp = new Object;
	            temp.isParticleColor = $byte.readBoolean();
	            temp.paramName = $byte.readUTF();
	            temp.url = $byte.readUTF();
	            if (temp.isParticleColor) {
	                temp.curve = new Object;
	                this.readTempCurve($byte, temp.curve);
	            }
	            this.materialParamData.texAry.push(temp);
	        }
	        this.readMaterialParaConAry($byte);
	    }
	    readTempCurve($byte, curve) {
	        curve.values = new Array();
	        var has = false;
	        if (this.version >= 12) {
	            var valuesLen = $byte.readInt();
	            if (valuesLen > 0) {
	                var scaleNum = $byte.readFloat();
	            }
	            for (var j = 0; j < valuesLen; j++) {
	                var rgbLen = $byte.readInt();
	                var valuesArr = new Array;
	                for (var k = 0; k < rgbLen; k++) {
	                    valuesArr.push($byte.readByte() / 127 * scaleNum);
	                }
	                curve.values.push(valuesArr);
	            }
	            has = true;
	        }
	        curve.type = $byte.readFloat();
	        curve.maxFrame = $byte.readFloat();
	        curve.sideType = $byte.readBoolean();
	        curve.speedType = $byte.readBoolean();
	        curve.useColorType = $byte.readBoolean();
	        curve.items = this.readItems($byte);
	        if (!has) {
	            this.makeCurveData(curve);
	        }
	    }
	    readItems($byte) {
	        var items = new Array();
	        var itemsLen = $byte.readInt();
	        for (var u = 0; u < itemsLen; u++) {
	            var $obj = new Object;
	            $obj.frame = $byte.readInt();
	            $obj.vec3 = $byte.readVector3D(true);
	            $obj.rotation = $byte.readVector3D(true);
	            $obj.rotationLeft = $byte.readVector3D(true);
	            items.push($obj);
	        }
	        return items;
	    }
	    makeCurveData($curve) {
	        var arr = $curve.items;
	        var r = new Array;
	        var g = new Array;
	        var b = new Array;
	        var a = new Array;
	        for (var i = 0; i < arr.length; i++) {
	            if (i == (arr.length - 1)) { //最后一个
	                r.push(arr[i].vec3.x);
	                g.push(arr[i].vec3.y);
	                b.push(arr[i].vec3.z);
	                a.push(arr[i].vec3.w);
	            }
	            else {
	                var $speedNum = arr[i + 1].frame - arr[i].frame;
	                var $A = arr[i].vec3;
	                var $B = arr[i + 1].vec3;
	                var $a = $curve.items[i].rotation;
	                var $b = $curve.items[i + 1].rotationLeft;
	                r = r.concat(this.getBzData($A.x, $B.x, $a.x, $b.x, $speedNum));
	                g = g.concat(this.getBzData($A.y, $B.y, $a.y, $b.y, $speedNum));
	                b = b.concat(this.getBzData($A.z, $B.z, $a.z, $b.z, $speedNum));
	                a = a.concat(this.getBzData($A.w, $B.w, $a.w, $b.w, $speedNum));
	            }
	        }
	        $curve.values = new Array();
	        $curve.values[0] = r;
	        $curve.values[1] = g;
	        $curve.values[2] = b;
	        $curve.values[3] = a;
	    }
	    getBzData($ax, $bx, ar, br, $speedNum) {
	        var num80 = 10;
	        var a = new Vector2D(0, $ax * num80);
	        var d = new Vector2D($speedNum, $bx * num80);
	        var m = new Matrix3D;
	        var p = new Vector3D;
	        m.identity();
	        m.appendRotation(-ar, Vector3D.Z_AXIS);
	        p = m.transformVector(new Vector3D($speedNum / 2, 0, 0));
	        var b = new Vector2D($speedNum / 2, a.y + p.y);
	        m.identity();
	        m.appendRotation(-br, Vector3D.Z_AXIS);
	        p = m.transformVector(new Vector3D(-$speedNum / 2, 0, 0));
	        var c = new Vector2D($speedNum / 2, d.y + p.y);
	        var ary = [a, b, c, d];
	        var posAry = new Array;
	        for (var i = 1; i < $speedNum * 3; i++) {
	            posAry.push(this.drawbezier(ary, i / ($speedNum * 3)));
	        }
	        var _valueVec = new Array;
	        for (i = 0; i < $speedNum; i++) {
	            for (var j = 0; j < posAry.length; j++) {
	                if (posAry[j].x >= i) {
	                    _valueVec.push(posAry[j].y / num80);
	                    break;
	                }
	            }
	        }
	        return _valueVec;
	    }
	    drawbezier(_array, _time) {
	        var _newarray = new Array();
	        if (_array.length == 0) {
	            return new Vector2D();
	        }
	        for (var i in _array) {
	            _newarray.push(new Vector2D(_array[i].x, _array[i].y));
	        }
	        while (_newarray.length > 1) {
	            for (var j = 0; j < _newarray.length - 1; j++) {
	                this.mathmidpoint(_newarray[j], _newarray[j + 1], _time);
	            }
	            _newarray.pop();
	        }
	        return _newarray[0];
	    }
	    mathmidpoint(a, b, t) {
	        var _nx, _ny;
	        _nx = a.x + (b.x - a.x) * t;
	        _ny = a.y + (b.y - a.y) * t;
	        a.x = _nx;
	        a.y = _ny;
	    }
	    readMaterialParaConAry($byte) {
	        var arr = new Array;
	        var conAryLen = $byte.readInt();
	        for (var i = 0; i < conAryLen; i++) {
	            var obj = new Object;
	            obj.type = $byte.readFloat();
	            obj.indexID = $byte.readFloat();
	            obj.paramName = $byte.readUTF();
	            obj.curve = new Object();
	            this.readTempCurve($byte, obj.curve);
	            arr.push(obj);
	        }
	        this.materialParamData.conAry = arr;
	    }
	    setFloat32Vec(key, ary) {
	    }
	    setFloat32Mat(key, ary) {
	    }
	}

	class Display3DParticle extends Object3D {
	    constructor() {
	        super();
	        this.isInGroup = false;
	        this.visible = true;
	        this._rotationMatrix = new Matrix3D();
	        this.modelMatrix = new Matrix3D();
	    }
	    onCreated() {
	    }
	    setBind($pos, $rotation, $scale, $invertRotation, $groupMatrix) {
	        this.bindVecter3d = $pos;
	        this.bindMatrix = $rotation;
	        this.bindScale = $scale;
	        this.invertBindMatrix = $invertRotation;
	        this.groupMatrix = $groupMatrix;
	    }
	    getMulBindList() {
	        return null;
	    }
	    updateMatrix() {
	        if (!this.bindMatrix) {
	            return;
	        }
	        this.modelMatrix.identity();
	        if (!this.groupMatrix.isIdentity) {
	            this.posMatrix.append(this.groupMatrix);
	        }
	        this.modelMatrix.append(this.posMatrix);
	        this.modelMatrix.append(this.bindMatrix);
	        this.modelMatrix.appendScale(SceneManager.scaleWorld.x, SceneManager.scaleWorld.y, SceneManager.scaleWorld.z);
	        this.modelMatrix.appendTranslation(this.bindVecter3d.x * SceneManager.scaleWorld.x, this.bindVecter3d.y * SceneManager.scaleWorld.y, this.bindVecter3d.z * SceneManager.scaleWorld.z);
	    }
	    //特效配置等级显示  是否能显示
	    get cantUseEffectsLev() {
	        var temp = this.data._renderPriority <= Scene_data.effectsLev; //0
	        return !temp;
	    }
	    updateTime(t) {
	        if (this.cantUseEffectsLev) {
	            return;
	        }
	        if (!this.bindScale) {
	            return;
	        }
	        this._time = t - this._beginTime;
	        this._time += this.data._delayedTime; //加上延时 
	        this.timeline.updateTime(t);
	        this.visible = this.timeline.visible;
	        this.posMatrix.identity();
	        this.posMatrix.prependScale(this._scaleX * 0.1 * this.bindScale.x * this.data.overAllScale, this._scaleY * 0.1 * this.bindScale.y * this.data.overAllScale, this._scaleZ * 0.1 * this.bindScale.z * this.data.overAllScale);
	        this.timeline.updateMatrix(this.posMatrix, this);
	    }
	    reset() {
	        this.timeline.reset();
	        this.updateTime(0);
	    }
	    clearAllAnim() {
	    }
	    update() {
	        if (this.cantUseEffectsLev) {
	            return;
	        }
	        if (!this.visible) {
	            return;
	        }
	        if (!this.data.materialParam || !this.data.materialParam.isTexReady()) {
	            return;
	        }
	        if (this.data._alphaMode == 0) {
	            this.data._alphaMode = -1; //特殊调整，还需要AS那边核对
	            //  console.log("改了")
	        }
	        Scene_data.context3D.setBlendParticleFactors(this.data._alphaMode);
	        Scene_data.context3D.cullFaceBack(this.data.materialParam.material.backCull);
	        if (this.data.materialParam) {
	            Scene_data.context3D.setProgram(this.data.materialParam.program);
	        }
	        this.updateMatrix();
	        this.setVc();
	        this.setVa();
	        this.resetVa();
	    }
	    setVc() {
	    }
	    pushVc() {
	        Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "vcmat", this.data.vcmatData);
	    }
	    setVa() {
	    }
	    resetVa() {
	    }
	    setMaterialVc() {
	        if (!this.data.materialParam) {
	            return;
	        }
	        var dynamicConstList = this.data.materialParam.dynamicConstList;
	        var t = this._time % (Scene_data.frameTime * this.data._life);
	        ////console.log(this._time);
	        for (var i = 0; i < dynamicConstList.length; i++) {
	            dynamicConstList[i].update(t);
	        }
	        if (this.data.materialParam.material.fcNum <= 0) {
	            return;
	        }
	        t = t * this.data.materialParam.material.timeSpeed;
	        this.data.materialParam.material.update(t);
	        ////console.log("fc5",this.data.materialParam.material.fcData[4]);
	        Scene_data.context3D.setVc4fv(this.data.materialParam.shader, "fc", this.data.materialParam.material.fcData);
	        // Scene_data.context3D.setVc4fv(this.data.materialParam.shader,"fc",[1,0,0,0,this.data.materialParam.material.fcData[4],0,0,0]); 
	        /**
	        if (this.data.materialParam.material.hasTime) {
	            t = t * this.data.materialParam.material.timeSpeed;
	 
	            Scene_data.context3D.setVc4fv(this.data.materialParam.shader, "fc0", [1, 0, 0, t])
	        }
	 
	        var constVec: Array<ConstItem> = this.data.materialParam.material.constList;
	        for (var i:number = 0; i < constVec.length; i++) {
	            Scene_data.context3D.setVc4fv(this.data.materialParam.shader, "fc" + constVec[i].id, constVec[i].vecNum);
	        }
	         */
	    }
	    setMaterialTexture() {
	        if (!this.data.materialParam) {
	            return;
	        }
	        var texVec = this.data.materialParam.material.texList;
	        for (var i = 0; i < texVec.length; i++) {
	            if (texVec[i].isDynamic) {
	                continue;
	            }
	            //_context3D.setTextureAt(texVec[i].id, texVec[i].texture);
	            Scene_data.context3D.setRenderTexture(this.data.materialParam.shader, texVec[i].name, texVec[i].texture, texVec[i].id, true);
	        }
	        var texDynamicVec = this.data.materialParam.dynamicTexList;
	        for (var i = 0; i < texDynamicVec.length; i++) {
	            // _context3D.setTextureAt(texDynamicVec[i].target.id, texDynamicVec[i].texture);
	            Scene_data.context3D.setRenderTexture(this.data.materialParam.shader, texDynamicVec[i].target.name, texDynamicVec[i].texture, texDynamicVec[i].target.id, true);
	        }
	    }
	    inverBind() {
	        if (!this.invertBindMatrix.isIdentity) {
	            //this.bindMatrix.invert();
	            this._rotationMatrix.prepend(this.invertBindMatrix);
	            //this.bindMatrix.invert();
	        }
	    }
	    resetPos() {
	    }
	    resetMulPos(ary) {
	    }
	    getVector3DByObject(obj) {
	        if (!obj) {
	            return null;
	        }
	        return new Vector3D(obj.x, obj.y, obj.z, obj.w);
	    }
	    clone() {
	        return null;
	    }
	    setAllByteInfo($byte, version = 0) {
	        this.creatData();
	        this.data.version = version;
	        this.data.setAllByteInfo($byte);
	        this.timeline = new TimeLine();
	        this.timeline.setAllDataInfo(this.data.timelineData);
	        this._beginTime = this.timeline.beginTime;
	    }
	    creatData() {
	        this.data = new ParticleData;
	    }
	    setTimeLine($tl) {
	        this.timeline = $tl;
	        this._beginTime = $tl.beginTime;
	    }
	    destory() {
	        this.timeline = null;
	        this.bindMatrix = null;
	        this.bindVecter3d = null;
	        this.bindScale = null;
	        this.invertBindMatrix = null;
	        this.groupMatrix = null;
	        this._rotationMatrix = null;
	        this.modelMatrix = null;
	        this.groupPos = null;
	        this.groupScale = null;
	        this.groupRotation = null;
	    }
	}

	class Display3DFacetShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "v2TexCoord");
	    }
	    getMat4Str(key) {
	        //return key;
	        return "vcmat[" + Display3DFacetShader.shader_mat4[key] + "]";
	    }
	    getVec4Str(key) {
	        //return key;
	        return "vcmat[" + Display3DFacetShader.shader_vec4[key][0] + "][" + Display3DFacetShader.shader_vec4[key][1] + "]";
	    }
	    static getVcSize() {
	        return 5;
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec4 v3Position;\n" +
	            "attribute vec2 v2TexCoord;\n" +
	            "uniform mat4 vcmat[" + Display3DFacetShader.getVcSize() + "];\n" + //所有vc值
	            //"uniform mat4 viewMatrix3D;\n" +
	            //"uniform mat4 camMatrix3D;\n" +
	            // "uniform mat4 rotationMatrix3D;\n" +
	            //"uniform mat4 posMatrix3D;\n" +
	            //"uniform vec2 uvMove;\n" +
	            "varying vec2 v0;\n" +
	            "void main(void){\n" +
	            "   v0 = v2TexCoord + vec2(" + this.getVec4Str("uvMove") + ".xy);\n" +
	            "   gl_Position = " + this.getMat4Str("viewMatrix3D") + "  * " + this.getMat4Str("camMatrix3D") + " * "
	            + this.getMat4Str("posMatrix3D") + " * " + this.getMat4Str("rotationMatrix3D") + " * v3Position;\n" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = " precision mediump float;\n" +
	            "uniform sampler2D tex;\n" +
	            "varying vec2 v0;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(tex, v0.xy);\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	Display3DFacetShader.Display3D_Facet_Shader = "Display3DFacetShader";
	Display3DFacetShader.shader_mat4 = { viewMatrix3D: 0, camMatrix3D: 1, rotationMatrix3D: 2, posMatrix3D: 3 };
	Display3DFacetShader.shader_vec4 = { uvMove: [4, 0] };

	class ParticleFacetData extends ParticleData {
	    constructor() {
	        super(...arguments);
	        this._isCycle = false; //是否循环
	    }
	    setAllByteInfo($byte) {
	        this._maxAnimTime = $byte.readFloat();
	        this._isCycle = $byte.readBoolean();
	        this._lockx = $byte.readBoolean();
	        this._locky = $byte.readBoolean();
	        super.setAllByteInfo($byte);
	        this.initVcData();
	        this.uploadGpu();
	    }
	    getParticle() {
	        return new Display3DFacetParticle;
	    }
	    uploadGpu() {
	        this.objData = new ObjData;
	        this.makeRectangleData(this._width, this._height, this._originWidthScale, this._originHeightScale, this._isUV, this._isU, this._isV, this._animLine, this._animRow);
	    }
	    makeRectangleData(width, height, offsetX = 0.5, offsetY = 0.5, isUV = false, isU = false, isV = false, animLine = 1, animRow = 1) {
	        var uvAry = new Array;
	        var verterList = new Array;
	        var ary = new Array;
	        ary.push(new Vector2D(0, 0));
	        ary.push(new Vector2D(0, 1 / animRow));
	        ary.push(new Vector2D(1 / animLine, 1 / animRow));
	        ary.push(new Vector2D(1 / animLine, 0));
	        if (isU) {
	            for (var i = 0; i < ary.length; i++) {
	                ary[i].x = -ary[i].x;
	            }
	        }
	        if (isV) {
	            for (var i = 0; i < ary.length; i++) {
	                ary[i].y = -ary[i].y;
	            }
	        }
	        if (isUV) {
	            ary.push(ary.shift());
	        }
	        for (var i = 0; i < ary.length; i++) {
	            uvAry.push(ary[i].x, ary[i].y);
	        }
	        verterList.push(-offsetX * width, height - offsetY * height, 0);
	        verterList.push(ary[0].x, ary[0].y);
	        verterList.push(width - offsetX * width, height - offsetY * height, 0);
	        verterList.push(ary[1].x, ary[1].y);
	        verterList.push(width - offsetX * width, -offsetY * height, 0);
	        verterList.push(ary[2].x, ary[2].y);
	        verterList.push(-offsetX * width, -offsetY * height, 0);
	        verterList.push(ary[3].x, ary[3].y);
	        var indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
	        let objData = this.objData;
	        objData.stride = 5 * 4;
	        let arybuff = new Float32Array(verterList);
	        let vertexBuffer = new VertexBuffer3D(arybuff.byteLength, WebGLRenderingContext.STATIC_DRAW, false);
	        let eles = [
	            new VertexElement(0, VertexElementFormat.Vector3, VertexMesh.MESH_POSITION0),
	            new VertexElement(12, VertexElementFormat.Vector2, VertexMesh.MESH_TEXTURECOORDINATE0),
	        ];
	        vertexBuffer.vertexDeclaration = new VertexDeclaration(objData.stride, eles);
	        vertexBuffer.setData(arybuff);
	        objData.layaVertexBuffer = vertexBuffer;
	        // this.objData.vertexBuffer = Scene_data.context3D.uploadBuff3D(verterList);
	        //this.objData.uvBuffer = Scene_data.context3D.uploadBuff3D(uvAry);
	        // this.objData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(indexs);
	        var indexBuffer = new IndexBuffer3D(objData.indexFormat, indices.length, WebGLRenderingContext.STATIC_DRAW, false);
	        indexBuffer.setData(indices);
	        objData.layaIndexBuffer = indexBuffer;
	        objData._setBuffer(vertexBuffer, indexBuffer);
	        objData.treNum = indices.length;
	    }
	    initVcData() {
	        this.vcmatData = new Float32Array(Display3DFacetShader.getVcSize() * 16);
	    }
	    setFloat32Vec(key, ary) {
	        var idxary = Display3DFacetShader.shader_vec4[key];
	        var idx = idxary[0] * 16 + idxary[1] * 4;
	        this.vcmatData.set(ary, idx);
	    }
	    setFloat32Mat(key, ary) {
	        var idx = Display3DFacetShader.shader_mat4[key] * 16;
	        this.vcmatData.set(ary, idx);
	    }
	    regShader() {
	        //var shader: Display3DFacetShader = new Display3DFacetShader();
	        this.materialParam.shader = ProgramManager.getInstance().getMaterialProgram(Display3DFacetShader.Display3D_Facet_Shader, Display3DFacetShader, this.materialParam.material);
	        this.materialParam.program = this.materialParam.shader.program;
	    }
	}

	class Display3DFacetParticle extends Display3DParticle {
	    constructor() {
	        super();
	        this._lifeVisible = true;
	        //this.objData = new ParticleGpuData();
	        //this.program = ProgrmaManager.getInstance().getProgram(Display3DFacetShader.Display3D_Facet_Shader);
	        this._resultUvVec = new Array(2);
	    }
	    get facetdata() {
	        return this.data;
	    }
	    creatData() {
	        this.data = new ParticleFacetData;
	    }
	    update() {
	        if (!this._lifeVisible) {
	            return;
	        }
	        super.update();
	    }
	    reset() {
	        super.reset();
	        this._lifeVisible = true;
	    }
	    setVc() {
	        this.updateRotaionMatrix();
	        this.updateUV();
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	        //this.data.setFloat32Mat("viewMatrix3D", Scene_data.viewMatrx3D.m);//0
	        this.data.vcmatData.set(Scene_data.viewMatrx3D.m, 0);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        //this.data.setFloat32Mat("camMatrix3D", Scene_data.cam3D.cameraMatrix.m);//16
	        this.data.vcmatData.set(Scene_data.cam3D.cameraMatrix.m, 16);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "posMatrix3D", this.modelMatrix.m);
	        //this.data.setFloat32Mat("posMatrix3D", this.modelMatrix.m);//48
	        this.data.vcmatData.set(this.modelMatrix.m, 48);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "rotationMatrix3D", this._rotationMatrix.m);
	        //this.data.setFloat32Mat("rotationMatrix3D", this._rotationMatrix.m);//32
	        this.data.vcmatData.set(this._rotationMatrix.m, 32);
	        //Scene_data.context3D.setVc2fv(this.data.materialParam.shader, "uvMove", this._resultUvVec);
	        //this.data.setFloat32Vec("uvMove",this._resultUvVec);//64
	        this.data.vcmatData.set(this._resultUvVec, 64);
	        this.setMaterialVc();
	        if (!this.facetdata._isCycle && this._time / Scene_data.frameTime > (this.data._life - 2)) {
	            this._lifeVisible = false;
	        }
	        Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "vcmat", this.data.vcmatData);
	    }
	    setVa() {
	        let objData = this.data.objData;
	        /*             var tf: boolean = Scene_data.context3D.pushVa(this.data.objData.vertexBuffer);
	                    if (!tf) {
	                        Scene_data.context3D.setVaOffset(0, 3, this.data.objData.stride, 0);
	                        Scene_data.context3D.setVaOffset(1, 2, this.data.objData.stride, 12);
	                    } */
	        objData._bufferState.bind();
	        //Scene_data.context3D.setVa(0, 3, this.data.objData.vertexBuffer);
	        //Scene_data.context3D.setVa(1, 2, this.data.objData.uvBuffer);
	        this.setMaterialTexture();
	        // objData.layaIndexBuffer.bind();
	        Scene_data.context3D.drawCallL3d(objData.treNum);
	        // objData._bufferState.unBind();
	        // Scene_data.context3D.drawCall(this.data.objData.indexBuffer, this.data.objData.treNum);
	    }
	    updateRotaionMatrix() {
	        this._rotationMatrix.identity();
	        if (this.data._watchEye) {
	            this.timeline.inverAxisRotation(this._rotationMatrix);
	            if (!this.facetdata._locky && !this.facetdata._lockx) {
	                this.inverBind();
	            }
	            if (!this.facetdata._locky) {
	                this._rotationMatrix.prependRotation(-Scene_data.cam3D.rotationY, Vector3D.Y_AXIS);
	            }
	            if (!this.facetdata._lockx) {
	                this._rotationMatrix.prependRotation(-Scene_data.cam3D.rotationX, Vector3D.X_AXIS);
	            }
	        }
	        if (this.data._isZiZhuan) {
	            this.timeline.applySelfRotation(this._rotationMatrix, this.data._ziZhuanAngly);
	        }
	    }
	    updateUV() {
	        var currentFrame = Util.float2int(this._time / Scene_data.frameTime);
	        currentFrame = currentFrame > this.facetdata._maxAnimTime ? this.facetdata._maxAnimTime : currentFrame;
	        currentFrame = (currentFrame / this.data._animInterval) % (this.data._animLine * this.data._animRow);
	        this._resultUvVec[0] = Util.float2int(currentFrame % this.data._animLine) / this.data._animLine + this._time / Scene_data.frameTime * this.data._uSpeed;
	        this._resultUvVec[1] = Util.float2int(currentFrame / this.data._animLine) / this.data._animRow + this._time / Scene_data.frameTime * this.data._vSpeed;
	    }
	}

	class Display3DBallShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "vPosition");
	        $context.bindAttribLocation(this.program, 1, "texcoord");
	        $context.bindAttribLocation(this.program, 2, "basePos");
	        $context.bindAttribLocation(this.program, 3, "speed");
	        var needRotation = this.paramAry[3];
	        if (needRotation) {
	            $context.bindAttribLocation(this.program, 4, "rotation");
	        }
	        var hasRandomClolr = this.paramAry[1];
	        if (hasRandomClolr) {
	            $context.bindAttribLocation(this.program, 5, "color");
	        }
	    }
	    //public static shader_vec4 = {time:[0,0],scale:[1,1],scaleCtrl:[2,2],force:[3,3],worldPos:[4,0],camPos:[5,1],animCtrl:[6,2],uvCtrl:[7,3]};
	    getMat4Str(key) {
	        return "vcmat[" + Display3DBallShader.shader_mat4[key] + "]";
	    }
	    getVec4Str(key) {
	        return "vcmat[" + Display3DBallShader.shader_vec4[key][0] + "][" + Display3DBallShader.shader_vec4[key][1] + "]";
	        //return  "vc[" + Display3DBallShader.shader_vec4[key][0] + "]";
	        //return key;
	    }
	    static getVcSize() {
	        return 7;
	    }
	    getVertexShaderString() {
	        var baseStr;
	        var scaleStr;
	        var rotationStr;
	        var posStr;
	        var addSpeedStr;
	        var mulStr;
	        var resultPosStr;
	        var particleColorStr;
	        var randomColorStr;
	        var uvDefaultStr;
	        var uvAnimStr;
	        var uvSpeedStr;
	        var randomColorStr;
	        var particleColorStr;
	        var defineBaseStr;
	        var defineScaleStr;
	        var defineRotaionStr;
	        var defineAddSpeedStr;
	        var defineMulStr;
	        var defineUvAnimStr;
	        var defineUvSpeedStr;
	        var defineRandomColor;
	        var defineParticleColor;
	        defineBaseStr =
	            "attribute vec4 vPosition;\n" +
	                "attribute vec3 texcoord;\n" + //uv坐标xy
	                "attribute vec4 basePos;\n" + //基础位置xyz，发射起始时间w
	                "attribute vec3 speed;\n" + //速度xyz
	                "uniform mat4 vcmat[" + Display3DBallShader.getVcSize() + "];\n" + //所有vc值
	                //"uniform mat4 watheye;\n" +//面向视点矩阵
	                //"uniform mat4 viewMatrix3D;\n" +//模型矩阵
	                //"uniform mat4 modelMatrix;\n" +//模型矩阵
	                //"uniform mat4 camMatrix3D;\n" +//摄像机矩阵
	                //"uniform vec4 time;\n" +//当前时间x,自身加速度y,粒子生命z,是否循环w
	                "varying vec2 v0;\n";
	        defineRandomColor =
	            "attribute vec4 color;\n" + //随机颜色
	                "varying vec4 v2;\n"; //随机颜色
	        defineScaleStr = "";
	        //"uniform vec4 scale;\n" +//缩放x，抖动周期y，抖动振幅z
	        //"uniform vec4 scaleCtrl;\n"//宽度不变，高度不变，最大比例，最小比例
	        defineRotaionStr =
	            "attribute vec2 rotation;\n"; //基础旋转x ， 旋转速度y
	        defineAddSpeedStr = "";
	        //"uniform vec3 force;\n";//外力x，外力y，外力z
	        defineMulStr = "";
	        //"uniform mat4 rotationMatrix;\n" +//旋转矩阵
	        //"uniform vec3 worldPos;\n" +//世界中的位置
	        //"uniform vec3 camPos;\n"//世界中的位置
	        defineUvAnimStr = "";
	        //"uniform vec3 animCtrl;\n"//动画行数x，动画列数，动画间隔
	        defineUvSpeedStr = "";
	        //"uniform vec2 uvCtrl;\n"//u滚动速度，v滚动速度
	        defineParticleColor =
	            "varying vec2 v1;\n"; //粒子颜色坐标
	        baseStr =
	            "float ctime = " + this.getVec4Str("time") + ".x - basePos.w;\n" + //计算当前时间
	                "if (" + this.getVec4Str("time") + ".w > 0.0 && ctime >= 0.0) {\n" +
	                "    ctime = fract(ctime / " + this.getVec4Str("time") + ".z) * " + this.getVec4Str("time") + ".z;\n" +
	                "}\n" +
	                "vec4 pos = vPosition;\n"; //自身位置
	        scaleStr =
	            "float stime = ctime - " + this.getVec4Str("scale") + ".w;\n" +
	                "stime = max(stime,0.0);\n" +
	                "float sf = " + this.getVec4Str("scale") + ".x * stime;\n" +
	                "if (" + this.getVec4Str("scale") + ".y != 0.0 && " + this.getVec4Str("scale") + ".z != 0.0) {\n" +
	                "    sf += sin(" + this.getVec4Str("scale") + ".y * stime) * " + this.getVec4Str("scale") + ".z;\n" +
	                "}\n" +
	                "if (sf > " + this.getVec4Str("scaleCtrl") + ".z) {\n" +
	                "    sf = " + this.getVec4Str("scaleCtrl") + ".z;\n" +
	                "} else if (sf < " + this.getVec4Str("scaleCtrl") + ".w) {\n" +
	                "    sf = " + this.getVec4Str("scaleCtrl") + ".w;\n" +
	                "}\n" +
	                "vec2 sv2 = vec2(" + this.getVec4Str("scaleCtrl") + ".x * sf, " + this.getVec4Str("scaleCtrl") + ".y * sf);\n" +
	                "sv2 = sv2 + 1.0;\n" +
	                "pos.x *= sv2.x;\n" +
	                "pos.y *= sv2.y;\n";
	        rotationStr =
	            "float angle = rotation.x + rotation.y * ctime;\n" +
	                "vec4 np = vec4(sin(angle), cos(angle), 0, 0);\n" +
	                "np.z = np.x * pos.y + np.y * pos.x;\n" + //b.x = sin_z * a.y + cos_z * a.x;
	                "np.w = np.y * pos.y - np.x * pos.x;\n" + //b.y = cos_z * a.y - sin_z * a.x;
	                "pos.xy = np.zw;\n";
	        posStr =
	            "vec3 addPos = speed * ctime;\n" + //运动部分
	                "vec3 uspeed = vec3(0,0,0);\n" +
	                "if (ctime < 0.0 || ctime >= " + this.getVec4Str("time") + ".z) {\n" + //根据时间控制粒子是否显示
	                "    addPos.y = addPos.y + 100000.0;\n" +
	                "}\n";
	        addSpeedStr =
	            "if(" + this.getVec4Str("time") + ".y != 0.0 && length(speed) != 0.0) {\n" +
	                "    uspeed = vec3(speed.x, speed.y, speed.z);\n" +
	                "    uspeed = normalize(uspeed);\n" +
	                "    uspeed = uspeed * " + this.getVec4Str("time") + ".y;\n" +
	                "    uspeed.xyz = uspeed.xyz + " + this.getVec4Str("force") + ".xyz;\n" +
	                "} else {\n" +
	                "    uspeed = vec3(" + this.getVec4Str("force") + ".x, " + this.getVec4Str("force") + ".y, " + this.getVec4Str("force") + ".z);\n" +
	                "}\n" +
	                "addPos.xyz = addPos.xyz + uspeed.xyz * ctime * ctime;\n";
	        mulStr =
	            "uspeed = speed + uspeed * ctime * 2.0;\n" + //当前速度方向
	                "uspeed = normalize(uspeed);\n" +
	                "vec4 tempMul = " + this.getMat4Str("rotationMatrix") + " * vec4(uspeed,1.0);\n" +
	                "uspeed.xyz = tempMul.xyz;\n" +
	                "uspeed = normalize(uspeed);\n" +
	                "vec3 cPos = addPos;\n" + //v(视点-位置)
	                "tempMul = " + this.getMat4Str("rotationMatrix") + " * vec4(cPos,1.0);\n" +
	                "cPos.xyz = tempMul.xyz; \n" +
	                "cPos.xyz = " + this.getVec4Str("worldPos") + ".xyz + cPos.xyz;\n" +
	                "cPos.xyz = " + this.getVec4Str("camPos") + ".xyz - cPos.xyz;\n" +
	                "cPos = normalize(cPos);\n" +
	                "cPos = cross(uspeed, cPos);\n" + //法线
	                "cPos = normalize(cPos);\n" +
	                "uspeed = uspeed * pos.x;\n" +
	                "cPos = cPos * pos.y;\n" +
	                "pos.xyz = uspeed.xyz + cPos.xyz;\n";
	        resultPosStr =
	            "pos = " + this.getMat4Str("watheye") + " * pos;\n" + //控制是否面向视点
	                "pos.xyz = pos.xyz + basePos.xyz + addPos.xyz;\n" +
	                "gl_Position = " + this.getMat4Str("viewMatrix3D") + " * " + this.getMat4Str("camMatrix3D") + " * " + this.getMat4Str("modelMatrix") + " * pos;\n";
	        uvDefaultStr =
	            "v0 = vec2(texcoord.x,texcoord.y);\n";
	        uvAnimStr =
	            "vec2 uv = vec2(texcoord.x,texcoord.y);\n" +
	                "float animframe = floor(ctime / " + this.getVec4Str("animCtrl") + ".z);\n" +
	                "animframe = animframe / " + this.getVec4Str("animCtrl") + ".x;\n" +
	                "uv.x += animframe;\n" +
	                "animframe = floor(animframe);\n" +
	                "uv.y += animframe / " + this.getVec4Str("animCtrl") + ".y;\n" +
	                "v0.xy = uv.xy;\n";
	        uvSpeedStr =
	            "vec2 uv = vec2(" + this.getVec4Str("uvCtrl") + ".x," + this.getVec4Str("uvCtrl") + ".y);\n" +
	                "uv.xy = uv.xy * ctime + texcoord.xy;\n" +
	                "v0.xy = uv.xy;\n";
	        randomColorStr =
	            "v2 = color;\n";
	        particleColorStr =
	            "v1 = vec2(ctime/" + this.getVec4Str("time") + ".z,1.0);\n";
	        //this.paramAry
	        var hasParticle = this.paramAry[0];
	        var hasRandomClolr = this.paramAry[1];
	        var isMul = this.paramAry[2];
	        var needRotation = this.paramAry[3];
	        var needScale = this.paramAry[4];
	        var needAddSpeed = this.paramAry[5];
	        var uvType = this.paramAry[6];
	        var str = "";
	        var defineStr = "";
	        str += baseStr;
	        defineStr += defineBaseStr;
	        if (needScale) {
	            str += scaleStr;
	            defineStr += defineScaleStr;
	        }
	        if (needRotation) {
	            str += rotationStr;
	            defineStr += defineRotaionStr;
	        }
	        str += posStr;
	        if (needAddSpeed) {
	            str += addSpeedStr;
	            defineStr += defineAddSpeedStr;
	        }
	        if (isMul) {
	            str += mulStr;
	            defineStr += defineMulStr;
	        }
	        str += resultPosStr;
	        if (uvType == 1) {
	            str += uvAnimStr;
	            defineStr += defineUvAnimStr;
	        }
	        else if (uvType == 2) {
	            str += uvSpeedStr;
	            defineStr += defineUvSpeedStr;
	        }
	        else {
	            str += uvDefaultStr;
	        }
	        if (hasRandomClolr) {
	            str += randomColorStr;
	            defineStr += defineRandomColor;
	        }
	        if (hasParticle) {
	            str += particleColorStr;
	            defineStr += defineParticleColor;
	        }
	        //str += uvStr
	        //str += particleColorStr
	        //str += randomColorStr
	        var resultAllStr = defineStr + "void main(){\n" + str + "}";
	        ////console.log(resultAllStr);
	        return resultAllStr;
	    }
	    getFragmentShaderString() {
	        var $str = " precision mediump float;\n" +
	            "uniform sampler2D tex;\n" +
	            "varying vec2 v0;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(tex, v0.xy);\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	Display3DBallShader.Display3D_Ball_Shader = "Display3DBallShader";
	Display3DBallShader.shader_mat4 = { viewMatrix3D: 0, camMatrix3D: 1, modelMatrix: 2, watheye: 3, rotationMatrix: 4 };
	Display3DBallShader.shader_vec4 = { time: [5, 0], scale: [5, 1], scaleCtrl: [5, 2], force: [5, 3], worldPos: [6, 0], camPos: [6, 1], animCtrl: [6, 2], uvCtrl: [6, 3] };

	class ParticleGpuData extends ObjData {
	}

	class ParticleBallGpuData extends ParticleGpuData {
	    destory() {
	        super.destory();
	        if (this.basePos) {
	            this.basePos.length = 0;
	            this.basePos = null;
	            if (this.basePosBuffer) {
	                Scene_data.context3D.deleteBuffer(this.basePosBuffer);
	                this.basePosBuffer = null;
	            }
	        }
	        if (this.beMove) {
	            this.beMove.length = 0;
	            this.beMove = null;
	            if (this.beMoveBuffer) {
	                Scene_data.context3D.deleteBuffer(this.beMoveBuffer);
	                this.beMoveBuffer = null;
	            }
	        }
	        if (this.randomColor) {
	            this.randomColor.length = 0;
	            this.randomColor = null;
	            if (this.randomColorBuffer) {
	                Scene_data.context3D.deleteBuffer(this.randomColorBuffer);
	                this.randomColorBuffer = null;
	            }
	        }
	        if (this.baseRotation) {
	            this.baseRotation.length = 0;
	            this.baseRotation = null;
	            if (this.baseRotationBuffer) {
	                Scene_data.context3D.deleteBuffer(this.baseRotationBuffer);
	                this.baseRotationBuffer = null;
	            }
	        }
	    }
	}

	class ParticleBallData extends ParticleData {
	    constructor() {
	        super(...arguments);
	        this._totalNum = 1;
	        this._acceleration = 0.2;
	        this._toscale = 0.00;
	        this._shootAngly = new Vector3D(1, 0, 0);
	        this._shootSpeed = 0;
	        this._isRandom = false;
	        this._isSendRandom = false;
	        this._isSendAngleRandom = false;
	        this._paticleMaxScale = 1;
	        this._paticleMinScale = 1;
	        this._addforce = new Vector3D(0, 0, 0);
	        this._lixinForce = new Vector3D(0, 0, 0);
	        this._waveform = new Vector3D(0, 0, 0, 0);
	        this._round = new Vector3D();
	        this._is3Dlizi = false;
	        this._speed = 1;
	        this._isLoop = false;
	        this._basePositon = new Vector3D(0, 0, 0);
	        this._baseRandomAngle = 0;
	        this._shapeType = 0;
	        this._playSpeed = 1;
	        this._beginScale = 0;
	    }
	    getParticle() {
	        return new Display3DBallPartilce;
	    }
	    setAllByteInfo($byte) {
	        this._totalNum = $byte.readFloat();
	        this._acceleration = $byte.readFloat();
	        this._toscale = $byte.readFloat();
	        this._shootSpeed = $byte.readFloat();
	        this._isRandom = $byte.readBoolean();
	        this._isSendRandom = $byte.readBoolean();
	        this._round.x = $byte.readFloat();
	        this._round.y = $byte.readFloat();
	        this._round.z = $byte.readFloat();
	        this._round.w = $byte.readFloat();
	        this._is3Dlizi = $byte.readBoolean();
	        this._halfCircle = $byte.readBoolean();
	        this._shootAngly.x = $byte.readFloat();
	        this._shootAngly.y = $byte.readFloat();
	        this._shootAngly.z = $byte.readFloat();
	        this._shootAngly.w = $byte.readFloat();
	        this._shootAngly.normalize(); //发射锥角，设置为摸范围内 原来没有做处理，新加
	        this._speed = $byte.readFloat();
	        this._isLoop = $byte.readBoolean();
	        this._isSendAngleRandom = $byte.readBoolean();
	        this._waveform.x = $byte.readFloat();
	        this._waveform.y = $byte.readFloat();
	        this._waveform.z = $byte.readFloat();
	        this._waveform.w = $byte.readFloat();
	        this._closeSurface = $byte.readBoolean();
	        this._isEven = $byte.readBoolean();
	        this._paticleMaxScale = $byte.readFloat();
	        this._paticleMinScale = $byte.readFloat();
	        this._basePositon.x = $byte.readFloat();
	        this._basePositon.y = $byte.readFloat();
	        this._basePositon.z = $byte.readFloat();
	        this._basePositon.w = $byte.readFloat();
	        this._baseRandomAngle = $byte.readFloat();
	        this._shapeType = $byte.readFloat();
	        this._lockX = $byte.readBoolean();
	        this._lockY = $byte.readBoolean();
	        this._addforce.x = $byte.readFloat();
	        this._addforce.y = $byte.readFloat();
	        this._addforce.z = $byte.readFloat();
	        this._addforce.w = $byte.readFloat();
	        this._addforce.scaleByW();
	        this._lixinForce.x = $byte.readFloat();
	        this._lixinForce.y = $byte.readFloat();
	        this._lixinForce.z = $byte.readFloat();
	        this._lixinForce.w = $byte.readFloat();
	        this._islixinAngly = $byte.readBoolean();
	        this._particleRandomScale = new Vector3D();
	        this._particleRandomScale.x = $byte.readFloat();
	        this._particleRandomScale.y = $byte.readFloat();
	        this._particleRandomScale.z = $byte.readFloat();
	        this._particleRandomScale.w = $byte.readFloat();
	        this._playSpeed = $byte.readFloat();
	        this.facez = $byte.readBoolean();
	        this._beginScale = $byte.readFloat();
	        this._widthFixed = $byte.readBoolean();
	        this._heightFixed = $byte.readBoolean();
	        this.readRandomColor($byte);
	        if (this._acceleration != 0 || this._addforce.x != 0 || this._addforce.y != 0 || this._addforce.z != 0) {
	            this._needAddSpeed = true;
	            this._addSpeedVec = [this._addforce.x, this._addforce.y, this._addforce.z];
	        }
	        else {
	            this._needAddSpeed = false;
	        }
	        if (this._toscale != 0 || this._waveform.x != 0 || this._waveform.y != 0) {
	            this._needScale = true;
	            this._scaleVec = [this._toscale, this._waveform.x, this._waveform.y, this._beginScale];
	            this._scaleCtrlVec = [this._widthFixed ? 0 : 1, this._heightFixed ? 0 : 1, this._paticleMaxScale - 1, this._paticleMinScale - 1];
	        }
	        else {
	            this._needScale = false;
	        }
	        super.setAllByteInfo($byte);
	        this._timeVec = [0, this._acceleration, this._life, this._isLoop ? 1 : -1];
	        if (this._is3Dlizi) {
	            this._wordPosVec = [0, 0, 0];
	            this._caramPosVec = [0, 0, 0];
	            this._allRotationMatrix = new Matrix3D();
	        }
	        this.initVcData();
	    }
	    readRandomColor($byte) {
	        var randomColorLen = $byte.readInt();
	        var obj = new Object;
	        obj.alpha = new Array;
	        obj.color = new Array;
	        obj.pos = new Array;
	        //fs.writeFloat(randomColor.alpha[i])
	        //fs.writeFloat(randomColor.color[i])
	        //fs.writeFloat(randomColor.pos[i])
	        for (var i = 0; i < randomColorLen; i++) {
	            obj.alpha.push($byte.readFloat());
	            obj.color.push($byte.readFloat());
	            obj.pos.push($byte.readFloat());
	        }
	        this._textureRandomColorInfo = obj;
	    }
	    get objBallData() {
	        return (this.objData);
	    }
	    uploadGpu() {
	        this.objData = new ParticleBallGpuData();
	        this.initBaseData();
	        this.initBasePos();
	        this.initSpeed();
	        this.initSelfRotaion();
	        if (this._needRandomColor) {
	            this.initBaseColor();
	        }
	        this.pushToGpu();
	    }
	    initBaseData() {
	        var verterList = new Array;
	        var uvAry = new Array;
	        var indexs = new Array;
	        for (var i = 0; i < this._totalNum; i++) {
	            this.makeRectangleData(verterList, uvAry, this._width, this._height, this._originWidthScale, this._originHeightScale, this._isUV, this._isU, this._isV, this._animLine, this._animRow, i);
	            indexs.push(0 + i * 4, 1 + i * 4, 2 + i * 4, 0 + i * 4, 2 + i * 4, 3 + i * 4);
	        }
	        this.objBallData.vertices = verterList;
	        this.objBallData.uvs = uvAry;
	        this.objBallData.indexs = indexs;
	    }
	    makeRectangleData(verterList, uvAry, width, height, offsetX = 0.5, offsetY = 0.5, isUV = false, isU = false, isV = false, animLine = 1, animRow = 1, indexID = 0) {
	        var ranScale = Math.random() * (this._particleRandomScale.x - this._particleRandomScale.y) + this._particleRandomScale.y;
	        verterList.push((-offsetX * width) * ranScale, (height - offsetY * height) * ranScale, 0);
	        verterList.push((width - offsetX * width) * ranScale, (height - offsetY * height) * ranScale, 0);
	        verterList.push((width - offsetX * width) * ranScale, (-offsetY * height) * ranScale, 0);
	        verterList.push((-offsetX * width) * ranScale, (-offsetY * height) * ranScale, 0);
	        var ary = new Array;
	        ary.push(new Vector2D(0, 0));
	        ary.push(new Vector2D(0, 1 / animRow));
	        ary.push(new Vector2D(1 / animLine, 1 / animRow));
	        ary.push(new Vector2D(1 / animLine, 0));
	        if (isU) {
	            for (var i = 0; i < ary.length; i++) {
	                ary[i].x = -ary[i].x;
	            }
	        }
	        if (isV) {
	            for (var i = 0; i < ary.length; i++) {
	                ary[i].y = -ary[i].y;
	            }
	        }
	        if (isUV) {
	            ary.push(ary.shift());
	        }
	        for (var i = 0; i < ary.length; i++) {
	            uvAry.push(ary[i].x, ary[i].y, indexID);
	        }
	    }
	    initBasePos() {
	        var basePos = new Array;
	        for (var i = 0; i < this._totalNum; i++) {
	            var v3d;
	            var ma;
	            if (this._isRandom) {
	                var roundv3d = new Vector3D(this._round.x * this._round.w, this._round.y * this._round.w, this._round.z * this._round.w);
	                if (this._isEven) { //圆柱
	                    if (this._closeSurface) { //紧贴表面
	                        v3d = new Vector3D(0, 0, roundv3d.z);
	                        ma = new Matrix3D;
	                        ma.appendRotation(Math.random() * 360, Vector3D.Y_AXIS);
	                        v3d = ma.transformVector(v3d);
	                        v3d.y = roundv3d.y * Math.random() * 2 - roundv3d.y;
	                    }
	                    else {
	                        v3d = new Vector3D(0, 0, roundv3d.z * Math.random() * 2 - roundv3d.z);
	                        ma = new Matrix3D;
	                        ma.appendRotation(Math.random() * 360, Vector3D.Y_AXIS);
	                        v3d = ma.transformVector(v3d);
	                        v3d.y = roundv3d.y * Math.random() * 2 - roundv3d.y;
	                    }
	                }
	                else { //圆球
	                    if (this._closeSurface) { //只有xyz相等时候才能紧贴表面
	                        v3d = new Vector3D(0, 0, roundv3d.z);
	                        ma = new Matrix3D;
	                        if (this._halfCircle) {
	                            ma.appendRotation(-Math.random() * 180, Vector3D.X_AXIS);
	                        }
	                        else {
	                            ma.appendRotation(Math.random() * 360, Vector3D.X_AXIS);
	                        }
	                        ma.appendRotation(Math.random() * 360, Vector3D.Y_AXIS);
	                        v3d = ma.transformVector(v3d);
	                    }
	                    else {
	                        if (this._halfCircle) {
	                            v3d = new Vector3D(roundv3d.x * Math.random() * 2 - roundv3d.x, roundv3d.y * Math.random(), roundv3d.z * Math.random() * 2 - roundv3d.z);
	                        }
	                        else {
	                            v3d = new Vector3D(roundv3d.x * Math.random() * 2 - roundv3d.x, roundv3d.y * Math.random() * 2 - roundv3d.y, roundv3d.z * Math.random() * 2 - roundv3d.z);
	                        }
	                    }
	                }
	            }
	            else {
	                v3d = new Vector3D();
	            }
	            v3d = v3d.add(this._basePositon);
	            for (var j = 0; j < 4; j++) {
	                basePos.push(v3d.x, v3d.y, v3d.z, i * this._shootSpeed);
	            }
	        }
	        this.objBallData.basePos = basePos;
	    }
	    initSpeed() {
	        var beMove = new Array;
	        for (var i = 0; i < this._totalNum; i++) {
	            var resultv3d = new Vector3D;
	            var v3d = new Vector3D;
	            // if(this._shootAngly.z == -1){
	            //     //console.log(this._shootAngly.z);
	            // }
	            if (this._shootAngly.x != 0 || this._shootAngly.y != 0 || this._shootAngly.z != 0) { //锥形速度
	                var r = Math.tan(this._shootAngly.w * Math.PI / 180 * Math.random());
	                var a = 360 * Math.PI / 180 * Math.random();
	                v3d = new Vector3D(Math.sin(a) * r, Math.cos(a) * r, 1);
	                var ma = new Matrix3D(); //moveMatrix3D();
	                ma.fromVtoV(new Vector3D(0, 0.0101, 0.99994), new Vector3D(this._shootAngly.x, this._shootAngly.y, this._shootAngly.z));
	                v3d = ma.transformVector(v3d);
	                if (isNaN(v3d.x)) {
	                    throw new Error("发射锥角，可能有问题，确定是否有取膜");
	                }
	                v3d.normalize();
	                resultv3d = resultv3d.add(v3d);
	            }
	            if (this._lixinForce.x != 0 || this._lixinForce.y != 0 || this._lixinForce.z != 0) {
	                v3d = new Vector3D(Math.random() > 0.5 ? -this._lixinForce.x : this._lixinForce.x, Math.random() > 0.5 ? -this._lixinForce.y : this._lixinForce.y, Math.random() > 0.5 ? -this._lixinForce.z : this._lixinForce.z);
	                v3d.normalize();
	                resultv3d = resultv3d.add(v3d);
	            }
	            if (this._islixinAngly) {
	                if (this._isEven) {
	                    v3d = new Vector3D(this.objBallData.basePos[i * 16], 0, this.objBallData.basePos[i * 16 + 2]);
	                }
	                else {
	                    v3d = new Vector3D(this.objBallData.basePos[i * 16], this.objBallData.basePos[i * 16 + 1], this.objBallData.basePos[i * 16 + 2]);
	                }
	                v3d.normalize();
	                resultv3d = resultv3d.add(v3d);
	            }
	            resultv3d.normalize();
	            if (this._isSendRandom) {
	                resultv3d.scaleBy(this._speed * Math.random());
	            }
	            else {
	                resultv3d.scaleBy(this._speed);
	            }
	            var ranAngle = this._baseRandomAngle * Math.random() * Math.PI / 180;
	            for (var j = 0; j < 4; j++) {
	                beMove.push(resultv3d.x, resultv3d.y, resultv3d.z);
	            }
	        }
	        this.objBallData.beMove = beMove;
	    }
	    initSelfRotaion() {
	        var _baseRotationAngle = 0;
	        var _baseRotationSpeed = 0;
	        if (this._ziZhuanAngly.x == 0 && this._ziZhuanAngly.y == 0 && this._ziZhuanAngly.z == 0 && this._ziZhuanAngly.w == 0) {
	            this._needSelfRotation = false;
	            return;
	        }
	        if (this._is3Dlizi) {
	            this._needSelfRotation = false;
	            return;
	        }
	        this._needSelfRotation = true;
	        var vecs = new Array;
	        var flag = 0;
	        while (flag < this._totalNum) {
	            _baseRotationAngle = this._ziZhuanAngly.x;
	            if (this._ziZhuanAngly.y == 1) {
	                _baseRotationAngle = _baseRotationAngle * Math.random();
	            }
	            _baseRotationSpeed = this._ziZhuanAngly.z;
	            if (this._ziZhuanAngly.w == 1) {
	                _baseRotationSpeed = _baseRotationSpeed * Math.random();
	            }
	            else if (this._ziZhuanAngly.w == -1) {
	                _baseRotationSpeed = _baseRotationSpeed * (Math.random() * 2 - 1);
	            }
	            vecs.push(_baseRotationAngle, _baseRotationSpeed);
	            vecs.push(_baseRotationAngle, _baseRotationSpeed);
	            vecs.push(_baseRotationAngle, _baseRotationSpeed);
	            vecs.push(_baseRotationAngle, _baseRotationSpeed);
	            flag++;
	        }
	        this.objBallData.baseRotation = vecs;
	    }
	    initBaseColor() {
	        var imgData = ColorTransition.getInstance().getImageData(this._textureRandomColorInfo);
	        var colorNum = imgData.data;
	        var colors = new Array;
	        for (var i = 0; i < this._totalNum; i++) {
	            var index = Util.float2int(128 * Math.random()) * 4;
	            var ranColor = new Vector3D(colorNum[index], colorNum[index + 1], colorNum[index + 2], colorNum[index + 3]);
	            ranColor.scaleBy(1 / 0xff);
	            colors.push(ranColor.x, ranColor.y, ranColor.z, ranColor.w);
	            colors.push(ranColor.x, ranColor.y, ranColor.z, ranColor.w);
	            colors.push(ranColor.x, ranColor.y, ranColor.z, ranColor.w);
	            colors.push(ranColor.x, ranColor.y, ranColor.z, ranColor.w);
	        }
	        this.objBallData.randomColor = colors;
	    }
	    pushToGpu() {
	        this.compressVertex();
	        /**
	        this.objBallData.vertexBuffer = Scene_data.context3D.uploadBuff3D(this.objBallData.vertices);//3
	 
	        this.objBallData.uvBuffer = Scene_data.context3D.uploadBuff3D(this.objBallData.uvs);//3
	 
	        this.objBallData.basePosBuffer = Scene_data.context3D.uploadBuff3D(this.objBallData.basePos);//4
	 
	        this.objBallData.beMoveBuffer = Scene_data.context3D.uploadBuff3D(this.objBallData.beMove);//3
	 
	        this.objBallData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(this.objBallData.indexs);
	 
	        this.objBallData.treNum = this.objBallData.indexs.length;
	 
	        if (this._needSelfRotation) {
	            this.objBallData.baseRotationBuffer = Scene_data.context3D.uploadBuff3D(this.objBallData.baseRotation);//2
	        }
	 
	        if (this._needRandomColor) {
	            this.objBallData.randomColorBuffer = Scene_data.context3D.uploadBuff3D(this.objBallData.randomColor);//4
	        }
	         */
	    }
	    compressVertex() {
	        let objBallData = this.objBallData;
	        var size = objBallData.vertices.length / 3;
	        var itemSize = 13;
	        if (this._needSelfRotation) {
	            itemSize += 2;
	        }
	        if (this._needRandomColor) {
	            objBallData.randomOffset = itemSize * 4;
	            itemSize += 4;
	        }
	        objBallData.stride = itemSize * 4;
	        var ary = new Array;
	        for (var i = 0; i < size; i++) {
	            for (var j = 0; j < 3; j++) {
	                ary.push(objBallData.vertices[i * 3 + j]);
	            }
	            for (var j = 0; j < 3; j++) {
	                ary.push(objBallData.uvs[i * 3 + j]);
	            }
	            for (var j = 0; j < 4; j++) {
	                ary.push(objBallData.basePos[i * 4 + j]);
	            }
	            for (var j = 0; j < 3; j++) {
	                ary.push(objBallData.beMove[i * 3 + j]);
	            }
	            if (this._needSelfRotation) {
	                for (var j = 0; j < 2; j++) {
	                    ary.push(objBallData.baseRotation[i * 2 + j]);
	                }
	            }
	            if (this._needRandomColor) {
	                for (var j = 0; j < 4; j++) {
	                    ary.push(objBallData.randomColor[i * 4 + j]);
	                }
	            }
	        }
	        /*         this.objBallData.vertexBuffer = Scene_data.context3D.uploadBuff3D(ary);
	                this.objBallData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(this.objBallData.indexs); */
	        objBallData.treNum = objBallData.indexs.length;
	        ////console.log(ary.length);
	        let arybuff = new Float32Array(ary);
	        let vertexBuffer = new VertexBuffer3D(arybuff.byteLength, WebGLRenderingContext.STATIC_DRAW, true);
	        let eles = [
	            new VertexElement(0, VertexElementFormat.Vector3, VertexMesh.MESH_POSITION0),
	            new VertexElement(12, VertexElementFormat.Vector3, VertexMesh.MESH_TEXTURECOORDINATE0),
	            new VertexElement(24, VertexElementFormat.Vector4, 2),
	            new VertexElement(40, VertexElementFormat.Vector3, 3),
	        ];
	        if (this._needSelfRotation) {
	            eles.push(new VertexElement(52, VertexElementFormat.Vector2, 4));
	        }
	        if (this._needRandomColor) {
	            eles.push(new VertexElement(objBallData.randomOffset, VertexElementFormat.Vector4, 5));
	        }
	        vertexBuffer.vertexDeclaration = new VertexDeclaration(objBallData.stride, eles);
	        vertexBuffer.setData(arybuff);
	        // this.objData.vertexBuffer = Scene_data.context3D.uploadBuff3D(verterList);
	        //this.objData.uvBuffer = Scene_data.context3D.uploadBuff3D(uvAry);
	        // this.objData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(indexs);
	        let indices = new Uint16Array(this.objBallData.indexs);
	        var indexBuffer = new IndexBuffer3D(objBallData.indexFormat, indices.length, WebGLRenderingContext.STATIC_DRAW, false);
	        indexBuffer.setData(indices);
	        objBallData.layaIndexBuffer = indexBuffer;
	        objBallData._setBuffer(vertexBuffer, indexBuffer);
	    }
	    setFloat32Vec(key, ary) {
	        var idxary = Display3DBallShader.shader_vec4[key];
	        var idx = idxary[0] * 16 + idxary[1] * 4;
	        //var idx:number = idxary[0] * 4;
	        this.vcmatData.set(ary, idx);
	    }
	    setFloat32Mat(key, ary) {
	        var idx = Display3DBallShader.shader_mat4[key] * 16;
	        this.vcmatData.set(ary, idx);
	    }
	    initVcData() {
	        this.vcmatData = new Float32Array(Display3DBallShader.getVcSize() * 16);
	        this.setFloat32Vec("time", this._timeVec);
	        if (this._needAddSpeed) {
	            //Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "force", this.balldata._addSpeedVec);
	            this.setFloat32Vec("force", this._addSpeedVec);
	        }
	        if (this._needScale) {
	            //Scene_data.context3D.setVc4fv(this.data.materialParam.shader, "scale", this.balldata._scaleVec);
	            //Scene_data.context3D.setVc4fv(this.data.materialParam.shader, "scaleCtrl", this.balldata._scaleCtrlVec);
	            this.setFloat32Vec("scale", this._scaleVec);
	            this.setFloat32Vec("scaleCtrl", this._scaleCtrlVec);
	        }
	        if (this._uvType == 1) {
	            //Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "animCtrl", this.balldata._animCtrlVec);
	            this.setFloat32Vec("animCtrl", this._animCtrlVec);
	        }
	        else if (this._uvType == 2) {
	            //Scene_data.context3D.setVc2fv(this.data.materialParam.shader, "uvCtrl", this.balldata._uvCtrlVec);
	            this.setFloat32Vec("uvCtrl", this._uvCtrlVec);
	        }
	    }
	    regShader() {
	        if (!this.materialParam) {
	            return;
	        }
	        var shaderParameAry = this.getShaderParam();
	        //var shader: Display3DBallShader = new Display3DBallShader()
	        this.materialParam.shader = ProgramManager.getInstance().getMaterialProgram(Display3DBallShader.Display3D_Ball_Shader, Display3DBallShader, this.materialParam.material, shaderParameAry);
	        this.materialParam.program = this.materialParam.shader.program;
	    }
	    getShaderParam() {
	        if (this._animRow != 1 || this._animLine != 1) {
	            this._uvType = 1;
	            this._animCtrlVec = [this._animLine, this._animRow, this._animInterval];
	        }
	        else if (this._uSpeed != 0 || this._vSpeed != 0) {
	            this._uvType = 2;
	            this._uvCtrlVec = [this._uSpeed, this._vSpeed];
	        }
	        else {
	            this._uvType = 0;
	        }
	        var hasParticleColor = this.materialParam.material.hasParticleColor;
	        this._needRandomColor = this.materialParam.material.hasVertexColor;
	        this.uploadGpu(); //椭球粒子需要判断是否包含随机色来确定va结构
	        var shaderParameAry;
	        var hasParticle;
	        if (hasParticleColor) {
	            hasParticle = 1;
	        }
	        else {
	            hasParticle = 0;
	        }
	        var hasRandomClolr = this._needRandomColor ? 1 : 0;
	        var isMul = this._is3Dlizi ? 1 : 0;
	        var needRotation = this._needSelfRotation ? 1 : 0;
	        var needScale = this._needScale ? 1 : 0;
	        var needAddSpeed = this._needAddSpeed ? 1 : 0;
	        shaderParameAry = [hasParticle, hasRandomClolr, isMul, needRotation, needScale, needAddSpeed, this._uvType];
	        return shaderParameAry;
	    }
	}

	class Display3DBallPartilce extends Display3DParticle {
	    constructor() {
	        super();
	        //this.objData = new ParticleBallGpuData();
	    }
	    get balldata() {
	        return this.data;
	    }
	    creatData() {
	        this.data = new ParticleBallData;
	    }
	    setVa() {
	        this.setVaCompress();
	        /**
	        Scene_data.context3D.setVa(0, 3, this.data.objData.vertexBuffer);
	        Scene_data.context3D.setVa(1, 3, this.data.objData.uvBuffer);
	        Scene_data.context3D.setVa(2, 4, this.particleBallData.basePosBuffer);
	        Scene_data.context3D.setVa(3, 3, this.particleBallData.beMoveBuffer);
	 
	        if (this.balldata._needSelfRotation) {
	            Scene_data.context3D.setVa(4, 2, this.particleBallData.baseRotationBuffer);
	        }
	 
	        if (this.balldata._needRandomColor) {
	            Scene_data.context3D.setVa(5, 4, this.particleBallData.randomColorBuffer);
	        }
	         */
	        this.setMaterialTexture();
	        Scene_data.context3D.drawCallL3d(this.data.objData.treNum);
	        // Scene_data.context3D.drawCall(this.data.objData.indexBuffer, this.data.objData.treNum);
	    }
	    setVaCompress() {
	        /*         var tf: boolean = Scene_data.context3D.pushVa(this.data.objData.vertexBuffer);
	                if (tf) {
	                    return;
	                }
	        
	                Scene_data.context3D.setVaOffset(0, 3, this.data.objData.stride, 0);
	                Scene_data.context3D.setVaOffset(1, 3, this.data.objData.stride, 12);
	                Scene_data.context3D.setVaOffset(2, 4, this.data.objData.stride, 24);
	                Scene_data.context3D.setVaOffset(3, 3, this.data.objData.stride, 40);
	        
	                if (this.balldata._needSelfRotation) {
	                    Scene_data.context3D.setVaOffset(4, 2, this.data.objData.stride, 52);
	                }
	        
	                if (this.balldata._needRandomColor) {
	                    Scene_data.context3D.setVaOffset(5, 4, this.particleBallData.stride, this.particleBallData.randomOffset);
	                } */
	        this.balldata.objData._bufferState.bind();
	    }
	    /*     public resetVa(): void {
	            //Scene_data.context3D.clearVa(2);
	            //Scene_data.context3D.clearVa(3);
	            //Scene_data.context3D.clearVa(4);
	            //Scene_data.context3D.clearVa(5);
	            Scene_data.context3D.clearTexture()
	        } */
	    setVc() {
	        this.updateWatchCaramMatrix();
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	        //this.balldata.setFloat32Mat("viewMatrix3D", Scene_data.viewMatrx3D.m);
	        this.balldata.vcmatData.set(Scene_data.viewMatrx3D.m, 0);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        //this.balldata.setFloat32Mat("camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        this.balldata.vcmatData.set(Scene_data.cam3D.cameraMatrix.m, 16);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "modelMatrix", this.modelMatrix.m);
	        //this.balldata.setFloat32Mat("modelMatrix", this.modelMatrix.m);//32
	        this.balldata.vcmatData.set(this.modelMatrix.m, 32);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "watheye", this._rotationMatrix.m);
	        //this.balldata.setFloat32Mat("watheye", this._rotationMatrix.m);//48
	        this.balldata.vcmatData.set(this._rotationMatrix.m, 48);
	        this.balldata._timeVec[0] = this._time / Scene_data.frameTime * this.balldata._playSpeed;
	        //Scene_data.context3D.setVc4fv(this.data.materialParam.shader, "time", this.balldata._timeVec);
	        //this.balldata.setFloat32Vec("time", this.balldata._timeVec);//80
	        this.balldata.vcmatData.set(this.balldata._timeVec, 80);
	        /**
	         if (this.balldata._needAddSpeed){
	             Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "force", this.balldata._addSpeedVec);
	         }
	 
	         if (this.balldata._needScale){
	             Scene_data.context3D.setVc4fv(this.data.materialParam.shader, "scale", this.balldata._scaleVec);
	             Scene_data.context3D.setVc4fv(this.data.materialParam.shader, "scaleCtrl", this.balldata._scaleCtrlVec);
	         }
	        */
	        if (this.balldata._is3Dlizi) {
	            this.updateAllRotationMatrix();
	            this.balldata._wordPosVec[0] = this.bindVecter3d.x;
	            this.balldata._wordPosVec[1] = this.bindVecter3d.y;
	            this.balldata._wordPosVec[2] = this.bindVecter3d.z;
	            this.balldata._caramPosVec[0] = Scene_data.cam3D.x;
	            this.balldata._caramPosVec[1] = Scene_data.cam3D.y;
	            this.balldata._caramPosVec[2] = Scene_data.cam3D.z;
	            //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "rotationMatrix", this.balldata._allRotationMatrix.m);
	            //this.balldata.setFloat32Mat("rotationMatrix", this.balldata._allRotationMatrix.m);//64
	            this.balldata.vcmatData.set(this.balldata._allRotationMatrix.m, 64);
	            //Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "worldPos", this.balldata._wordPosVec);
	            //this.balldata.setFloat32Vec("worldPos", this.balldata._wordPosVec);//96
	            this.balldata.vcmatData.set(this.balldata._wordPosVec, 96);
	            //Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "camPos", this.balldata._caramPosVec);
	            //this.balldata.setFloat32Vec("camPos", this.balldata._caramPosVec);//100
	            this.balldata.vcmatData.set(this.balldata._caramPosVec, 100);
	        }
	        /**
	        if (this.balldata._uvType == 1) {
	            Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "animCtrl", this.balldata._animCtrlVec);
	        } else if (this.balldata._uvType == 2) {
	            Scene_data.context3D.setVc2fv(this.data.materialParam.shader, "uvCtrl", this.balldata._uvCtrlVec);
	        }
	         */
	        Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "vcmat", this.balldata.vcmatData);
	        this.setMaterialVc();
	    }
	    updateWatchCaramMatrix() {
	        this._rotationMatrix.identity();
	        if (this.balldata.facez) {
	            this._rotationMatrix.prependRotation(90, Vector3D.X_AXIS);
	        }
	        else if (this.balldata._is3Dlizi) {
	            //if (_axisRotaion) {
	            //    _rotationMatrix.prependRotation(-_axisRotaion.num, _axisRotaion.axis);
	            //}
	            this.timeline.inverAxisRotation(this._rotationMatrix);
	            this.inverBind();
	        }
	        else if (this.balldata._watchEye) {
	            //if (_axisRotaion) {
	            //    _rotationMatrix.prependRotation(-_axisRotaion.num, _axisRotaion.axis);
	            //}
	            this.timeline.inverAxisRotation(this._rotationMatrix);
	            this.inverBind();
	            this._rotationMatrix.prependRotation(-Scene_data.cam3D.rotationY, Vector3D.Y_AXIS);
	            this._rotationMatrix.prependRotation(-Scene_data.cam3D.rotationX, Vector3D.X_AXIS);
	        }
	    }
	    updateAllRotationMatrix() {
	        this.balldata._allRotationMatrix.identity();
	        this.balldata._allRotationMatrix.prependScale(this.data.overAllScale * this._scaleX * 0.1 * this.bindScale.x, this.data.overAllScale * this._scaleY * 0.1 * this.bindScale.y, this.data.overAllScale * this._scaleZ * 0.1 * this.bindScale.z);
	        //if (_axisRotaion) {
	        //    _allRotationMatrix.appendRotation(_axisRotaion.num, _axisRotaion.axis, _axisRotaion.axisPos);
	        //}
	        this.timeline.inverAxisRotation(this._rotationMatrix);
	        if (this.isInGroup) {
	            this.balldata._allRotationMatrix.appendRotation(this.groupRotation.x, Vector3D.X_AXIS);
	            this.balldata._allRotationMatrix.appendRotation(this.groupRotation.y, Vector3D.Y_AXIS);
	            this.balldata._allRotationMatrix.appendRotation(this.groupRotation.z, Vector3D.Z_AXIS);
	        }
	        if (this.bindMatrix) {
	            this.balldata._allRotationMatrix.append(this.bindMatrix);
	        }
	    }
	    get particleBallData() {
	        return (this.data.objData);
	    }
	}

	class Display3DLocusShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "v2TexCoord");
	        if (this.paramAry[0]) {
	            $context.bindAttribLocation(this.program, 2, "v3Normal");
	        }
	    }
	    getMat4Str(key) {
	        //return key;
	        return "vcmat[" + Display3DLocusShader.shader_mat4[key] + "]";
	    }
	    getVec4Str(key) {
	        //return key;
	        return "vcmat[" + Display3DLocusShader.shader_vec4[key][0] + "][" + Display3DLocusShader.shader_vec4[key][1] + "]";
	    }
	    static getVcSize() {
	        return 4;
	    }
	    getVertexShaderString() {
	        var defineBaseStr = "attribute vec4 v3Position;\n" +
	            "attribute vec2 v2TexCoord;\n" +
	            "uniform mat4 vcmat[" + Display3DFacetShader.getVcSize() + "];\n" + //所有vc值
	            //"uniform mat4 viewMatrix3D;\n" +
	            //"uniform mat4 camMatrix3D;\n" +
	            //"uniform mat4 posMatrix3D;\n" +
	            // "uniform vec3 uvMove;\n" +
	            "varying vec2 v0;\n" +
	            "varying vec4 v2;\n";
	        var defineWachtStr = "attribute vec4 v3Normal;\n"; // +
	        //"uniform vec3 camPos;\n";
	        var defineUvStr = "";
	        //"uniform vec3 isUv;\n";
	        var defineParticleColor = "varying vec2 v1;\n";
	        var baseStr = "   vec2 tempv0 = v2TexCoord;\n" +
	            "   tempv0.x -= " + this.getVec4Str("uvMove") + ".x;\n";
	        var particleColorStr = "   v1 = v2TexCoord;\n";
	        var baseUvStr = "   v0 = tempv0;\n";
	        var uvStr = "   tempv0.xy *= " + this.getVec4Str("isUv") + ".xy;\n" +
	            "   if(" + this.getVec4Str("isUv") + ".z >= 0.0){\n" +
	            "   vec2 tempv1 = tempv0;\n" +
	            "   tempv0.y = tempv1.x;\n" +
	            "   tempv0.x = tempv1.y;}\n" +
	            "   v0 = tempv0;\n";
	        var killStr = "   float alpha = tempv0.x/" + this.getVec4Str("uvMove") + ".y;\n" +
	            "   alpha = 1.0 - clamp(abs(alpha),0.0,1.0);\n" +
	            "   float kill = -tempv0.x;\n" +
	            "   kill *= tempv0.x - " + this.getVec4Str("uvMove") + ".z;\n" +
	            "   v2 = vec4(kill,0.0,0.0,alpha);\n";
	        var posStr = "   gl_Position = " + this.getMat4Str("viewMatrix3D") + "  * " + this.getMat4Str("camMatrix3D") + " * " + this.getMat4Str("posMatrix3D") + " * v3Position;\n";
	        var watchPosStr = "   vec4 tempPos = " + this.getMat4Str("posMatrix3D") + " * v3Position;\n" +
	            "   vec3 mulPos = vec3(tempPos.x,tempPos.y,tempPos.z);\n" +
	            "   vec3 normals = vec3(v3Normal.x,v3Normal.y,v3Normal.z);\n" +
	            "   mulPos = normalize(vec3(" + this.getVec4Str("camPos") + ".xyz) - mulPos);\n" +
	            "   mulPos = cross(mulPos, normals);\n" +
	            "   mulPos = normalize(mulPos);\n" +
	            "   mulPos *= v3Normal.w;\n" +
	            "   tempPos.xyz = mulPos.xyz + v3Position.xyz;\n" +
	            "   gl_Position = " + this.getMat4Str("viewMatrix3D") + "  * " + this.getMat4Str("camMatrix3D") + " * " + this.getMat4Str("posMatrix3D") + " * tempPos;\n";
	        var isWatchEye = this.paramAry[0];
	        var isUV = this.paramAry[1];
	        var hasParticleColor = this.paramAry[2];
	        var defineStr = defineBaseStr;
	        if (isWatchEye) {
	            defineStr += defineWachtStr;
	        }
	        if (isUV) {
	            defineStr += defineUvStr;
	        }
	        if (hasParticleColor) {
	            defineStr += defineParticleColor;
	        }
	        var mainStr = baseStr + killStr;
	        if (hasParticleColor) {
	            mainStr += particleColorStr;
	        }
	        if (isUV) {
	            mainStr += uvStr;
	        }
	        else {
	            mainStr += baseUvStr;
	        }
	        if (isWatchEye) {
	            mainStr += watchPosStr;
	        }
	        else {
	            mainStr += posStr;
	        }
	        var resultStr = defineStr + "void main(void){\n" + mainStr + "}";
	        return resultStr;
	    }
	    getFragmentShaderString() {
	        var $str = " precision mediump float;\n" +
	            "uniform sampler2D tex;\n" +
	            "varying vec2 v0;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(tex, v0.xy);\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	Display3DLocusShader.Display3D_Locus_Shader = "Display3DLocusShader";
	Display3DLocusShader.shader_mat4 = { viewMatrix3D: 0, camMatrix3D: 1, posMatrix3D: 2 };
	Display3DLocusShader.shader_vec4 = { uvMove: [3, 0], camPos: [3, 1], isUv: [3, 2] };

	class ParticleLocusData extends ParticleData {
	    constructor() {
	        super(...arguments);
	        this._speed = 1; //粒子运动数字
	        this._isLoop = false; //是否循环
	    }
	    getParticle() {
	        return new Display3DLocusPartilce;
	    }
	    setAllByteInfo($byte) {
	        this.objData = new ObjData;
	        this._isLoop = $byte.readBoolean(); //b
	        this._speed = $byte.readFloat(); //f
	        this._density = $byte.readFloat(); //f
	        this._isEnd = $byte.readBoolean(); //b
	        this._watchEye = $byte.readBoolean(); //添加字段bool
	        let eles = [
	            new VertexElement(0, VertexElementFormat.Vector3, VertexMesh.MESH_POSITION0),
	            new VertexElement(12, VertexElementFormat.Vector2, VertexMesh.MESH_TEXTURECOORDINATE0)
	        ];
	        if (this._watchEye) {
	            eles.push(new VertexElement(20, VertexElementFormat.Vector4, 2));
	        }
	        let stride = this._watchEye ? 36 : 20;
	        let vertexDeclaration = new VertexDeclaration(stride, eles);
	        var vLen = $byte.getInt();
	        this.objData.stride = vertexDeclaration.vertexStride;
	        var dataWidth = stride / 4;
	        var len = vLen * stride;
	        this.objData.stride = vertexDeclaration.vertexStride;
	        var dataWidth = stride / 4;
	        var len = vLen * stride;
	        var arybuff = new ArrayBuffer(len);
	        var data = new DataView(arybuff);
	        BaseRes.readBytes2ArrayBuffer($byte, data, 3, 0, dataWidth, 4); //vertices
	        BaseRes.readBytes2ArrayBuffer($byte, data, 2, 3, dataWidth, 4); //uv
	        if (this._watchEye) {
	            BaseRes.readBytes2ArrayBuffer($byte, data, 4, 5, dataWidth, 4); //normal
	        }
	        // var vLen: number = $byte.readInt();
	        // for (var i: number = 0; i < vLen; i++) {
	        //     this.objData.vertices.push($byte.readFloat())
	        // }
	        // var nLen: number = $byte.readInt();
	        // for (var i: number = 0; i < nLen; i++) {
	        //     this.objData.normals.push($byte.readFloat())
	        // }
	        // var uLen: number = $byte.readInt();
	        // for (var j: number = 0; j < uLen; j++) {
	        //     this.objData.uvs.push($byte.readFloat())
	        // }
	        let indices = BaseRes.readIndexForInt($byte);
	        super.setAllByteInfo($byte);
	        this.initUV();
	        if (this._watchEye) {
	            this._caramPosVec = [0, 0, 0];
	        }
	        this._uvVec = [this._isU ? -1 : 1, this._isV ? -1 : 1, this._isUV ? 1 : -1];
	        // this.uploadGpu();
	        this.initVcData();
	        let vertexBuffer = new VertexBuffer3D(arybuff.byteLength, WebGLRenderingContext.STATIC_DRAW, true);
	        vertexBuffer.vertexDeclaration = vertexDeclaration;
	        vertexBuffer.setData(arybuff);
	        this.objData.layaVertexBuffer = vertexBuffer;
	        // meshData.vertexBuffer = Scene_data.context3D.uploadBuff3DArrayBuffer(arybuff);
	        var indexBuffer = new IndexBuffer3D(this.objData.indexFormat, indices.length, WebGLRenderingContext.STATIC_DRAW, false);
	        indexBuffer.setData(indices);
	        this.objData.layaIndexBuffer = indexBuffer;
	        this.objData._setBuffer(vertexBuffer, indexBuffer);
	        this.objData.treNum = indices.length;
	    }
	    initUV() {
	        this._resultUvVec = new Array(3);
	        var $nowTime = 0;
	        var $lifeRoundNum = (this._life / 100);
	        var $moveUv = this._speed * $nowTime / this._density / 10;
	        if (this._isEnd) {
	            $moveUv = Math.min(1, $moveUv);
	        }
	        var $fcVector;
	        if (this._isLoop) {
	            if (this._life) {
	                $moveUv = $moveUv % ($lifeRoundNum + 1);
	                $fcVector = new Vector3D($moveUv, $lifeRoundNum, -$lifeRoundNum);
	            }
	            else {
	                $moveUv = $moveUv % 1;
	                $fcVector = new Vector3D($moveUv + 1, 99, -2);
	            }
	        }
	        else {
	            if (this._life) {
	                $fcVector = new Vector3D($moveUv, $lifeRoundNum, -1);
	            }
	            else {
	                $fcVector = new Vector3D($moveUv, 99, -1);
	            }
	        }
	        this._resultUvVec[0] = $fcVector.x;
	        this._resultUvVec[1] = $fcVector.y;
	        this._resultUvVec[2] = $fcVector.z;
	    }
	    uploadGpu() {
	        this.objData.vertexBuffer = Scene_data.context3D.uploadBuff3D(this.objData.vertices);
	        this.objData.uvBuffer = Scene_data.context3D.uploadBuff3D(this.objData.uvs);
	        if (this._watchEye) {
	            this.objData.normalsBuffer = Scene_data.context3D.uploadBuff3D(this.objData.normals);
	        }
	        this.objData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(this.objData.indexs);
	        this.objData.treNum = this.objData.indexs.length;
	    }
	    regShader() {
	        if (!this.materialParam) {
	            return;
	        }
	        var isWatchEye = this._watchEye ? 1 : 0;
	        var changeUv = 0;
	        var hasParticleColor = this.materialParam.material.hasParticleColor;
	        if (this._isU || this._isV || this._isUV) {
	            changeUv = 1;
	            this._changUv = true;
	        }
	        else {
	            this._changUv = false;
	        }
	        var shaderParameAry;
	        shaderParameAry = [isWatchEye, changeUv, hasParticleColor ? 1 : 0];
	        //var shader: Display3DLocusShader = new Display3DLocusShader();
	        this.materialParam.shader = ProgramManager.getInstance().getMaterialProgram(Display3DLocusShader.Display3D_Locus_Shader, Display3DLocusShader, this.materialParam.material, shaderParameAry);
	        this.materialParam.program = this.materialParam.shader.program;
	    }
	    initVcData() {
	        this.vcmatData = new Float32Array(Display3DLocusShader.getVcSize() * 16);
	    }
	    setFloat32Vec(key, ary) {
	        var idxary = Display3DLocusShader.shader_vec4[key];
	        var idx = idxary[0] * 16 + idxary[1] * 4;
	        this.vcmatData.set(ary, idx);
	    }
	    setFloat32Mat(key, ary) {
	        var idx = Display3DLocusShader.shader_mat4[key] * 16;
	        this.vcmatData.set(ary, idx);
	    }
	}

	class Display3DLocusPartilce extends Display3DParticle {
	    constructor() {
	        super();
	        //this.objData = new ParticleGpuData();
	    }
	    get locusdata() {
	        return this.data;
	    }
	    creatData() {
	        this.data = new ParticleLocusData;
	    }
	    setVa() {
	        this.setMaterialTexture();
	        let objData = this.data.objData;
	        objData._bufferState.bind();
	        // Scene_data.context3D.drawCall(objData.indexBuffer, objData.treNum);
	        Scene_data.context3D.drawCallL3d(objData.treNum);
	        objData._bufferState.unBind();
	        Scene_data.context3D.setWriteDepth(false);
	        // var tf: boolean = Scene_data.context3D.pushVa(this.data.objData.vertexBuffer);
	        // if (!tf) {
	        //     Scene_data.context3D.setVaOffset(0, 3, this.data.objData.stride, 0);
	        //     Scene_data.context3D.setVaOffset(1, 2, this.data.objData.stride, 28);
	        //     if (this.data._watchEye) {
	        //         Scene_data.context3D.setVaOffset(2, 4, this.data.objData.stride, 12);
	        //     }
	        // }
	        // // Scene_data.context3D.setVa(0, 3, this.data.objData.vertexBuffer);
	        // // Scene_data.context3D.setVa(1, 2, this.data.objData.uvBuffer);
	        // // if (this.data._watchEye){
	        // //     Scene_data.context3D.setVa(2, 4, this.data.objData.normalsBuffer);
	        // // }
	        // this.setMaterialTexture();
	        // Scene_data.context3D.drawCall(this.data.objData.indexBuffer, this.data.objData.treNum);
	    }
	    setVc() {
	        this.updateUV();
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	        //this.data.setFloat32Mat("viewMatrix3D", Scene_data.viewMatrx3D.m);//0
	        this.data.vcmatData.set(Scene_data.viewMatrx3D.m, 0);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        //this.data.setFloat32Mat("camMatrix3D", Scene_data.cam3D.cameraMatrix.m);//16
	        this.data.vcmatData.set(Scene_data.cam3D.cameraMatrix.m, 16);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "posMatrix3D", this.modelMatrix.m);
	        //this.data.setFloat32Mat("posMatrix3D", this.modelMatrix.m);//32
	        this.data.vcmatData.set(this.modelMatrix.m, 32);
	        //Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "uvMove", this.locusdata._resultUvVec);
	        //this.data.setFloat32Vec("uvMove", this.locusdata._resultUvVec);//48
	        this.data.vcmatData.set(this.locusdata._resultUvVec, 48);
	        if (this.data._watchEye) {
	            this.locusdata._caramPosVec[0] = Scene_data.cam3D.x;
	            this.locusdata._caramPosVec[1] = Scene_data.cam3D.y;
	            this.locusdata._caramPosVec[2] = Scene_data.cam3D.z;
	            //Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "camPos", this.locusdata._caramPosVec);
	            //this.data.setFloat32Vec("camPos", this.locusdata._caramPosVec);//52
	            this.data.vcmatData.set(this.locusdata._caramPosVec, 52);
	        }
	        if (this.locusdata._changUv) {
	            //Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "isUv", this.locusdata._uvVec);
	            this.data.setFloat32Vec("isUv", this.locusdata._uvVec); //56
	        }
	        Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "vcmat", this.data.vcmatData);
	        this.setMaterialVc();
	    }
	    updateUV() {
	        var $nowTime = this._time / Scene_data.frameTime;
	        var $lifeRoundNum = (this.data._life / 100);
	        var $moveUv = this.locusdata._speed * $nowTime / this.locusdata._density / 10;
	        if (this.locusdata._isEnd) {
	            $moveUv = Math.min(1, $moveUv);
	        }
	        if (this.locusdata._isLoop) {
	            if (this.locusdata._life) {
	                $moveUv = $moveUv % ($lifeRoundNum + 1);
	            }
	            else {
	                $moveUv = $moveUv % 1;
	            }
	        }
	        this.locusdata._resultUvVec[0] = $moveUv;
	    }
	}

	class ParticleLocusballData extends ParticleBallData {
	    getParticle() {
	        return new Display3DLocusBallPartilce;
	    }
	    initBasePos() {
	        var basePos = new Array;
	        for (var i = 0; i < this._totalNum; i++) {
	            var v3d;
	            var index = i * 3;
	            if (this._isRandom) {
	                var roundv3d = new Vector3D(this._round.x * this._round.w, this._round.y * this._round.w, this._round.z * this._round.w);
	                v3d = new Vector3D(this._posAry[index] + Math.random() * roundv3d.x, this._posAry[index + 1] + Math.random() * roundv3d.y, this._posAry[index + 2] + Math.random() * roundv3d.z);
	            }
	            else {
	                v3d = new Vector3D(this._posAry[index], this._posAry[index + 1], this._posAry[index + 2]);
	            }
	            v3d = v3d.add(this._basePositon);
	            for (var j = 0; j < 4; j++) {
	                basePos.push(v3d.x, v3d.y, v3d.z, i * this._shootSpeed);
	            }
	        }
	        this.objBallData.basePos = basePos;
	    }
	    initSpeed() {
	        var beMove = new Array;
	        for (var i = 0; i < this._totalNum; i++) {
	            var resultv3d = new Vector3D;
	            if (this._tangentSpeed == 0) {
	                resultv3d.addByNum(this._angleAry[i * 3], this._angleAry[i * 3 + 1], this._angleAry[i * 3 + 2]);
	            }
	            else if (this._tangentSpeed == 2) {
	                resultv3d.setTo(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
	            }
	            else {
	                var v3d = new Vector3D(this._tangentAry[i * 3], this._tangentAry[i * 3 + 1], this._tangentAry[i * 3 + 2]);
	                v3d.scaleBy(this._tangentSpeed);
	                resultv3d = resultv3d.add(v3d);
	            }
	            resultv3d.normalize();
	            if (this._isSendRandom) {
	                resultv3d.scaleBy(this._speed * Math.random());
	            }
	            else {
	                resultv3d.scaleBy(this._speed);
	            }
	            //var ranAngle: Number = this._baseRandomAngle * Math.random() * Math.PI / 180;
	            for (var j = 0; j < 4; j++) {
	                beMove.push(resultv3d.x, resultv3d.y, resultv3d.z);
	            }
	        }
	        this.objBallData.beMove = beMove;
	    }
	    setAllByteInfo($byte) {
	        this._tangentSpeed = $byte.readFloat();
	        this._posAry = JSON.parse($byte.readUTF());
	        this._angleAry = JSON.parse($byte.readUTF());
	        this._tangentAry = JSON.parse($byte.readUTF());
	        super.setAllByteInfo($byte);
	        this.uploadGpu();
	    }
	}

	class Display3DLocusBallPartilce extends Display3DBallPartilce {
	    //protected _posAry: Array<number>;
	    //protected _angleAry: Array<number>;
	    //protected _tangentAry: Array<number>;
	    //protected _tangentSpeed:number;
	    constructor() {
	        super();
	    }
	    creatData() {
	        this.data = new ParticleLocusballData;
	    }
	}

	class ParticleModelData extends ParticleData {
	    getParticle() {
	        return new Display3DModelPartilce();
	    }
	    setAllByteInfo($byte) {
	        let objData = this.objData = new ObjData;
	        this._maxAnimTime = $byte.readFloat();
	        // var vLen: number = $byte.readInt();
	        // for (var i: number = 0; i < vLen; i++) {
	        //     this.objData.vertices.push($byte.readFloat())
	        // }
	        // var uLen: number = $byte.readInt();
	        // for (var j: number = 0; j < uLen; j++) {
	        //     this.objData.uvs.push($byte.readFloat())
	        // }
	        let vertexFlag = "POSITION,UV";
	        let vertexDeclaration = VertexMesh.getVertexDeclaration(vertexFlag, true);
	        var vLen = $byte.getInt();
	        let stride = objData.stride = vertexDeclaration.vertexStride;
	        var dataWidth = stride / 4;
	        var len = vLen * stride;
	        var arybuff = new ArrayBuffer(len);
	        var data = new DataView(arybuff);
	        BaseRes.readBytes2ArrayBuffer($byte, data, 3, 0, dataWidth, 4); //vertices
	        BaseRes.readBytes2ArrayBuffer($byte, data, 2, 3, dataWidth, 4); //uv
	        let indices = BaseRes.readIndexForInt($byte);
	        if (this.version >= 36) {
	            this._depthMode = $byte.readInt(); //新加模型特效深度信息
	        }
	        super.setAllByteInfo($byte);
	        //this.uploadGpu();
	        this.initVcData();
	        let vertexBuffer = new VertexBuffer3D(arybuff.byteLength, WebGLRenderingContext.STATIC_DRAW, true);
	        vertexBuffer.vertexDeclaration = vertexDeclaration;
	        vertexBuffer.setData(arybuff);
	        objData.layaVertexBuffer = vertexBuffer;
	        // meshData.vertexBuffer = Scene_data.context3D.uploadBuff3DArrayBuffer(arybuff);
	        var indexBuffer = new IndexBuffer3D(objData.indexFormat, indices.length, WebGLRenderingContext.STATIC_DRAW, false);
	        indexBuffer.setData(indices);
	        objData.layaIndexBuffer = indexBuffer;
	        objData._setBuffer(vertexBuffer, indexBuffer);
	        objData.treNum = indices.length;
	    }
	    initVcData() {
	        this.vcmatData = new Float32Array(Display3DFacetShader.getVcSize() * 16);
	    }
	    uploadGpu() {
	        this.objData.vertexBuffer = Scene_data.context3D.uploadBuff3D(this.objData.vertices);
	        this.objData.uvBuffer = Scene_data.context3D.uploadBuff3D(this.objData.uvs);
	        this.objData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(this.objData.indexs);
	        this.objData.treNum = this.objData.indexs.length;
	    }
	    regShader() {
	        //var shader: Display3DFacetShader = new Display3DFacetShader()
	        this.materialParam.shader = ProgramManager.getInstance().getMaterialProgram(Display3DFacetShader.Display3D_Facet_Shader, Display3DFacetShader, this.materialParam.material);
	        this.materialParam.program = this.materialParam.shader.program;
	    }
	    setFloat32Vec(key, ary) {
	        var idxary = Display3DFacetShader.shader_vec4[key];
	        var idx = idxary[0] * 16 + idxary[1] * 4;
	        this.vcmatData.set(ary, idx);
	    }
	    setFloat32Mat(key, ary) {
	        var idx = Display3DFacetShader.shader_mat4[key] * 16;
	        this.vcmatData.set(ary, idx);
	    }
	}

	class Display3DModelPartilce extends Display3DParticle {
	    constructor() {
	        super();
	        //this.objData = new ParticleGpuData();
	        this._resultUvVec = new Array(2);
	    }
	    get modeldata() {
	        return this.data;
	    }
	    creatData() {
	        this.data = new ParticleModelData;
	    }
	    setVc() {
	        this.updateWatchCaramMatrix();
	        this.updateUV();
	        // Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	        // Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        // Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "posMatrix3D", this.modelMatrix.m);
	        // Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "rotationMatrix3D", this._rotationMatrix.m);
	        // Scene_data.context3D.setVc2fv(this.data.materialParam.shader, "uvMove", this._resultUvVec);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	        //this.data.setFloat32Mat("viewMatrix3D", Scene_data.viewMatrx3D.m);//0
	        this.data.vcmatData.set(Scene_data.viewMatrx3D.m, 0);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        //this.data.setFloat32Mat("camMatrix3D", Scene_data.cam3D.cameraMatrix.m);//16
	        this.data.vcmatData.set(Scene_data.cam3D.cameraMatrix.m, 16);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "posMatrix3D", this.modelMatrix.m);
	        //this.data.setFloat32Mat("posMatrix3D", this.modelMatrix.m);//48
	        this.data.vcmatData.set(this.modelMatrix.m, 48);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "rotationMatrix3D", this._rotationMatrix.m);
	        //this.data.setFloat32Mat("rotationMatrix3D", this._rotationMatrix.m);//32
	        this.data.vcmatData.set(this._rotationMatrix.m, 32);
	        //Scene_data.context3D.setVc2fv(this.data.materialParam.shader, "uvMove", this._resultUvVec);
	        //this.data.setFloat32Vec("uvMove",this._resultUvVec);//64
	        this.data.vcmatData.set(this._resultUvVec, 64);
	        Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "vcmat", this.data.vcmatData);
	        this.setMaterialVc();
	    }
	    setVa() {
	        //Scene_data.context3D.setVa(0, 3, this.data.objData.vertexBuffer);
	        //Scene_data.context3D.setVa(1, 2, this.data.objData.uvBuffer);
	        Scene_data.context3D.setWriteDepth(this.data._depthMode == 1);
	        this.setMaterialTexture();
	        let objData = this.data.objData;
	        objData._bufferState.bind();
	        // Scene_data.context3D.drawCall(objData.indexBuffer, objData.treNum);
	        Scene_data.context3D.drawCallL3d(objData.treNum);
	        objData._bufferState.unBind();
	        Scene_data.context3D.setWriteDepth(false);
	    }
	    updateWatchCaramMatrix() {
	        this._rotationMatrix.identity();
	        if (this.data._watchEye) {
	            this.timeline.inverAxisRotation(this._rotationMatrix);
	            this._rotationMatrix.prependRotation(-Scene_data.cam3D.rotationY, Vector3D.Y_AXIS);
	            this._rotationMatrix.prependRotation(-Scene_data.cam3D.rotationX, Vector3D.X_AXIS);
	        }
	        if (this.data._isZiZhuan) {
	            this.timeline.applySelfRotation(this._rotationMatrix, this.data._ziZhuanAngly);
	        }
	        //if (_axisRotaion) {
	        //    _rotationMatrix.prependRotation(-_axisRotaion.num, _axisRotaion.axis);
	        //}
	    }
	    updateUV() {
	        var currentFrame = Math.floor((this._time / Scene_data.frameTime) / this.data._animInterval);
	        var _maxAnimTime = this.data._animLine * this.data._animRow;
	        this._resultUvVec[0] = Math.floor(currentFrame % this.data._animLine) / this.data._animLine;
	        this._resultUvVec[1] = Math.floor(currentFrame / this.data._animLine) / this.data._animRow;
	        this._resultUvVec[0] += this._time / Scene_data.frameTime * this.data._uSpeed;
	        this._resultUvVec[1] += this._time / Scene_data.frameTime * this.data._vSpeed;
	    }
	}

	class Display3DModelObjParticle extends Display3DModelPartilce {
	    constructor() {
	        super();
	    }
	    update() {
	        if (this._depthMode) {
	            Scene_data.context3D.setDepthTest(true);
	        }
	        super.update();
	        if (this._depthMode) {
	            Scene_data.context3D.setDepthTest(false);
	        }
	    }
	}

	class Display3dModelAnimParticle extends Display3DModelPartilce {
	    constructor() {
	        super();
	    }
	    updateUV() {
	        var currentFrame = this._time / Scene_data.frameTime;
	        currentFrame = currentFrame > this.modeldata._maxAnimTime ? this.modeldata._maxAnimTime : currentFrame;
	        currentFrame = (currentFrame / this.data._animInterval) % (this.data._animLine * this.data._animRow);
	        this._resultUvVec[0] = Util.float2int(currentFrame % this.data._animLine) / this.data._animLine + this._time / Scene_data.frameTime * this.data._uSpeed;
	        this._resultUvVec[1] = Util.float2int(currentFrame / this.data._animLine) / this.data._animRow + this._time / Scene_data.frameTime * this.data._vSpeed;
	    }
	}

	class Display3DFollowShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "vPosition");
	        $context.bindAttribLocation(this.program, 1, "texcoord");
	        $context.bindAttribLocation(this.program, 2, "basePos");
	        $context.bindAttribLocation(this.program, 3, "speed");
	        var needRotation = this.paramAry[3];
	        if (needRotation) {
	            $context.bindAttribLocation(this.program, 4, "rotation");
	        }
	        var hasRandomClolr = this.paramAry[1];
	        if (hasRandomClolr) {
	            $context.bindAttribLocation(this.program, 5, "color");
	        }
	    }
	    //public static shader_vec4 = {time:[0,0],scale:[1,1],scaleCtrl:[2,2],force:[3,3],worldPos:[4,0],camPos:[5,1],animCtrl:[6,2],uvCtrl:[7,3]};
	    getMat4Str(key) {
	        return "vcmat[" + Display3DBallShader.shader_mat4[key] + "]";
	    }
	    getVec4Str(key) {
	        return "vcmat[" + Display3DBallShader.shader_vec4[key][0] + "][" + Display3DBallShader.shader_vec4[key][1] + "]";
	        //return  "vc[" + Display3DBallShader.shader_vec4[key][0] + "]";
	        //return key;
	    }
	    static getVcSize() {
	        return 7;
	    }
	    getVertexShaderString() {
	        var baseStr;
	        var scaleStr;
	        var rotationStr;
	        var posStr;
	        var addSpeedStr;
	        var mulStr;
	        var resultPosStr;
	        var particleColorStr;
	        var randomColorStr;
	        var uvDefaultStr;
	        var uvAnimStr;
	        var uvSpeedStr;
	        var randomColorStr;
	        var particleColorStr;
	        var defineBaseStr;
	        var defineScaleStr;
	        var defineRotaionStr;
	        var defineAddSpeedStr;
	        var defineMulStr;
	        var defineUvAnimStr;
	        var defineUvSpeedStr;
	        var defineRandomColor;
	        var defineParticleColor;
	        defineBaseStr =
	            "attribute vec4 vPosition;\n" +
	                "attribute vec3 texcoord;\n" + //uv坐标xy
	                "attribute vec4 basePos;\n" + //基础位置xyz，发射起始时间w
	                "attribute vec3 speed;\n" + //速度xyz
	                "uniform mat4 vcmat[" + Display3DBallShader.getVcSize() + "];\n" + //所有vc值
	                "uniform vec3 bindpos[30];\n" +
	                //"uniform mat4 watheye;\n" +//面向视点矩阵
	                //"uniform mat4 viewMatrix3D;\n" +//模型矩阵
	                //"uniform mat4 modelMatrix;\n" +//模型矩阵
	                //"uniform mat4 camMatrix3D;\n" +//摄像机矩阵
	                //"uniform vec4 time;\n" +//当前时间x,自身加速度y,粒子生命z,是否循环w
	                "varying vec2 v0;\n";
	        defineRandomColor =
	            "attribute vec4 color;\n" + //随机颜色
	                "varying vec4 v2;\n"; //随机颜色
	        defineScaleStr = "";
	        //"uniform vec4 scale;\n" +//缩放x，抖动周期y，抖动振幅z
	        //"uniform vec4 scaleCtrl;\n"//宽度不变，高度不变，最大比例，最小比例
	        defineRotaionStr =
	            "attribute vec2 rotation;\n"; //基础旋转x ， 旋转速度y
	        defineAddSpeedStr = "";
	        //"uniform vec3 force;\n";//外力x，外力y，外力z
	        defineMulStr = "";
	        //"uniform mat4 rotationMatrix;\n" +//旋转矩阵
	        //"uniform vec3 worldPos;\n" +//世界中的位置
	        //"uniform vec3 camPos;\n"//世界中的位置
	        defineUvAnimStr = "";
	        //"uniform vec3 animCtrl;\n"//动画行数x，动画列数，动画间隔
	        defineUvSpeedStr = "";
	        //"uniform vec2 uvCtrl;\n"//u滚动速度，v滚动速度
	        defineParticleColor =
	            "varying vec2 v1;\n"; //粒子颜色坐标
	        baseStr =
	            "float ctime = " + this.getVec4Str("time") + ".x - basePos.w;\n" + //计算当前时间
	                "if (" + this.getVec4Str("time") + ".w > 0.0 && ctime >= 0.0) {\n" +
	                "    ctime = fract(ctime / " + this.getVec4Str("time") + ".z) * " + this.getVec4Str("time") + ".z;\n" +
	                "}\n" +
	                "vec4 pos = vPosition;\n"; //自身位置
	        scaleStr =
	            "float stime = ctime - " + this.getVec4Str("scale") + ".w;\n" +
	                "stime = max(stime,0.0);\n" +
	                "float sf = " + this.getVec4Str("scale") + ".x * stime;\n" +
	                "if (" + this.getVec4Str("scale") + ".y != 0.0 && " + this.getVec4Str("scale") + ".z != 0.0) {\n" +
	                "    sf += sin(" + this.getVec4Str("scale") + ".y * stime) * " + this.getVec4Str("scale") + ".z;\n" +
	                "}\n" +
	                "if (sf > " + this.getVec4Str("scaleCtrl") + ".z) {\n" +
	                "    sf = " + this.getVec4Str("scaleCtrl") + ".z;\n" +
	                "} else if (sf < " + this.getVec4Str("scaleCtrl") + ".w) {\n" +
	                "    sf = " + this.getVec4Str("scaleCtrl") + ".w;\n" +
	                "}\n" +
	                "vec2 sv2 = vec2(" + this.getVec4Str("scaleCtrl") + ".x * sf, " + this.getVec4Str("scaleCtrl") + ".y * sf);\n" +
	                "sv2 = sv2 + 1.0;\n" +
	                "pos.x *= sv2.x;\n" +
	                "pos.y *= sv2.y;\n";
	        rotationStr =
	            "float angle = rotation.x + rotation.y * ctime;\n" +
	                "vec4 np = vec4(sin(angle), cos(angle), 0, 0);\n" +
	                "np.z = np.x * pos.y + np.y * pos.x;\n" + //b.x = sin_z * a.y + cos_z * a.x;
	                "np.w = np.y * pos.y - np.x * pos.x;\n" + //b.y = cos_z * a.y - sin_z * a.x;
	                "pos.xy = np.zw;\n";
	        posStr =
	            "vec3 addPos = speed * ctime;\n" + //运动部分
	                "vec3 uspeed = vec3(0,0,0);\n" +
	                "if (ctime < 0.0 || ctime >= " + this.getVec4Str("time") + ".z) {\n" + //根据时间控制粒子是否显示
	                "    addPos.y = addPos.y + 100000.0;\n" +
	                "}\n";
	        addSpeedStr =
	            "if(" + this.getVec4Str("time") + ".y != 0.0 && length(speed) != 0.0) {\n" +
	                "    uspeed = vec3(speed.x, speed.y, speed.z);\n" +
	                "    uspeed = normalize(uspeed);\n" +
	                "    uspeed = uspeed * " + this.getVec4Str("time") + ".y;\n" +
	                "    uspeed.xyz = uspeed.xyz + " + this.getVec4Str("force") + ".xyz;\n" +
	                "} else {\n" +
	                "    uspeed = vec3(" + this.getVec4Str("force") + ".x, " + this.getVec4Str("force") + ".y, " + this.getVec4Str("force") + ".z);\n" +
	                "}\n" +
	                "addPos.xyz = addPos.xyz + uspeed.xyz * ctime * ctime;\n";
	        mulStr =
	            "uspeed = speed + uspeed * ctime * 2.0;\n" + //当前速度方向
	                "uspeed = normalize(uspeed);\n" +
	                "vec4 tempMul = " + this.getMat4Str("rotationMatrix") + " * vec4(uspeed,1.0);\n" +
	                "uspeed.xyz = tempMul.xyz;\n" +
	                "uspeed = normalize(uspeed);\n" +
	                "vec3 cPos = addPos;\n" + //v(视点-位置)
	                "tempMul = " + this.getMat4Str("rotationMatrix") + " * vec4(cPos,1.0);\n" +
	                "cPos.xyz = tempMul.xyz; \n" +
	                "cPos.xyz = " + this.getVec4Str("worldPos") + ".xyz + cPos.xyz;\n" +
	                "cPos.xyz = " + this.getVec4Str("camPos") + ".xyz - cPos.xyz;\n" +
	                "cPos = normalize(cPos);\n" +
	                "cPos = cross(uspeed, cPos);\n" + //法线
	                "cPos = normalize(cPos);\n" +
	                "uspeed = uspeed * pos.x;\n" +
	                "cPos = cPos * pos.y;\n" +
	                "pos.xyz = uspeed.xyz + cPos.xyz;\n";
	        resultPosStr =
	            "pos = " + this.getMat4Str("watheye") + " * pos;\n" + //控制是否面向视点
	                "pos.xyz = pos.xyz + basePos.xyz + addPos.xyz;\n" +
	                "pos = " + this.getMat4Str("modelMatrix") + " * pos;\n" +
	                "pos.xyz = pos.xyz + bindpos[int(texcoord.z)].xyz;\n" +
	                "gl_Position = " + this.getMat4Str("viewMatrix3D") + " * " + this.getMat4Str("camMatrix3D") + " * pos;\n";
	        uvDefaultStr =
	            "v0 = vec2(texcoord.x,texcoord.y);\n";
	        uvAnimStr =
	            "vec2 uv = vec2(texcoord.x,texcoord.y);\n" +
	                "float animframe = floor(ctime / " + this.getVec4Str("animCtrl") + ".z);\n" +
	                "animframe = animframe / " + this.getVec4Str("animCtrl") + ".x;\n" +
	                "uv.x += animframe;\n" +
	                "animframe = floor(animframe);\n" +
	                "uv.y += animframe / " + this.getVec4Str("animCtrl") + ".y;\n" +
	                "v0.xy = uv.xy;\n";
	        uvSpeedStr =
	            "vec2 uv = vec2(" + this.getVec4Str("uvCtrl") + ".x," + this.getVec4Str("uvCtrl") + ".y);\n" +
	                "uv.xy = uv.xy * ctime + texcoord.xy;\n" +
	                "v0.xy = uv.xy;\n";
	        randomColorStr =
	            "v2 = color;\n";
	        particleColorStr =
	            "v1 = vec2(ctime/" + this.getVec4Str("time") + ".z,1.0);\n";
	        //this.paramAry
	        var hasParticle = this.paramAry[0];
	        var hasRandomClolr = this.paramAry[1];
	        var isMul = this.paramAry[2];
	        var needRotation = this.paramAry[3];
	        var needScale = this.paramAry[4];
	        var needAddSpeed = this.paramAry[5];
	        var uvType = this.paramAry[6];
	        var str = "";
	        var defineStr = "";
	        str += baseStr;
	        defineStr += defineBaseStr;
	        if (needScale) {
	            str += scaleStr;
	            defineStr += defineScaleStr;
	        }
	        if (needRotation) {
	            str += rotationStr;
	            defineStr += defineRotaionStr;
	        }
	        str += posStr;
	        if (needAddSpeed) {
	            str += addSpeedStr;
	            defineStr += defineAddSpeedStr;
	        }
	        if (isMul) {
	            str += mulStr;
	            defineStr += defineMulStr;
	        }
	        str += resultPosStr;
	        if (uvType == 1) {
	            str += uvAnimStr;
	            defineStr += defineUvAnimStr;
	        }
	        else if (uvType == 2) {
	            str += uvSpeedStr;
	            defineStr += defineUvSpeedStr;
	        }
	        else {
	            str += uvDefaultStr;
	        }
	        if (hasRandomClolr) {
	            str += randomColorStr;
	            defineStr += defineRandomColor;
	        }
	        if (hasParticle) {
	            str += particleColorStr;
	            defineStr += defineParticleColor;
	        }
	        //str += uvStr
	        //str += particleColorStr
	        //str += randomColorStr
	        var resultAllStr = defineStr + "void main(){\n" + str + "}";
	        ////console.log(resultAllStr);
	        return resultAllStr;
	    }
	    getFragmentShaderString() {
	        var $str = " precision mediump float;\n" +
	            "uniform sampler2D tex;\n" +
	            "varying vec2 v0;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(tex, v0.xy);\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	Display3DFollowShader.Display3D_Follow_Shader = "Display3DFollowShader";
	Display3DFollowShader.shader_mat4 = { viewMatrix3D: 0, camMatrix3D: 1, modelMatrix: 2, watheye: 3, rotationMatrix: 4 };
	Display3DFollowShader.shader_vec4 = { time: [5, 0], scale: [5, 1], scaleCtrl: [5, 2], force: [5, 3], worldPos: [6, 0], camPos: [6, 1], animCtrl: [6, 2], uvCtrl: [6, 3] };

	class ParticleFollowData extends ParticleBallData {
	    getParticle() {
	        return new Display3DFollowPartilce;
	    }
	    setAllByteInfo($byte) {
	        super.setAllByteInfo($byte);
	        //this.initBingMatrixAry();
	        this.uploadGpu();
	    }
	    regShader() {
	        if (!this.materialParam) {
	            return;
	        }
	        var shaderParameAry = this.getShaderParam();
	        //var shader: Display3DFollowShader = new Display3DFollowShader()
	        this.materialParam.shader = ProgramManager.getInstance().getMaterialProgram(Display3DFollowShader.Display3D_Follow_Shader, Display3DFollowShader, this.materialParam.material, shaderParameAry);
	        this.materialParam.program = this.materialParam.shader.program;
	    }
	}

	class Display3DFollowPartilce extends Display3DBallPartilce {
	    constructor() {
	        super();
	        this.flag = 0;
	    }
	    get followdata() {
	        return this.data;
	    }
	    creatData() {
	        this.data = new ParticleFollowData;
	    }
	    onCreated() {
	        this.initBingMatrixAry();
	    }
	    // public setAllByteInfo($byte: ByteArray, version: number = 0): void {
	    //     super.setAllByteInfo($byte, version);
	    //     this.initBingMatrixAry();
	    // }
	    setVc() {
	        super.setVc();
	        this.updateBind();
	        // for (var i: number = 0; i < this.followdata._totalNum; i++) {
	        //     Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "bindpos[" + i + "]", this._bindMatrixAry[i]);
	        // }
	        Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "bindpos", this._bindMatrixAry);
	    }
	    initBingMatrixAry() {
	        this._bindMatrixAry = new Float32Array(40 * 3);
	        this._bindFlagAry = new Array;
	        for (var i = 0; i < this.followdata._totalNum; i++) {
	            //this._bindMatrixAry.push([0, 0, 0]);
	            this._bindFlagAry.push(0);
	        }
	    }
	    updateBind() {
	        var time = this._time / Scene_data.frameTime;
	        for (var i = this.flag; i < this.followdata._totalNum; i++) {
	            var temp = (time - i * this.followdata._shootSpeed) / this.followdata._life;
	            if (temp >= this._bindFlagAry[i]) {
	                //   //console.log(this.bindVecter3d);
	                var flag = i * 3;
	                this._bindMatrixAry[flag] = this.bindVecter3d.x;
	                this._bindMatrixAry[flag + 1] = this.bindVecter3d.y;
	                this._bindMatrixAry[flag + 2] = this.bindVecter3d.z;
	                this._bindFlagAry[i]++;
	            }
	        }
	    }
	    updateMatrix() {
	        if (!this.bindMatrix) {
	            return;
	        }
	        this.modelMatrix.identity();
	        if (!this.groupMatrix.isIdentity) {
	            this.posMatrix.append(this.groupMatrix);
	        }
	        this.modelMatrix.append(this.posMatrix);
	    }
	    updateAllRotationMatrix() {
	        this.followdata._allRotationMatrix.identity();
	        this.followdata._allRotationMatrix.prependScale(this.followdata.overAllScale * this._scaleX * 0.1 * this.bindScale.x, this.followdata.overAllScale * this._scaleY * 0.1 * this.bindScale.y, this.followdata.overAllScale * this._scaleZ * 0.1 * this.bindScale.z);
	        if (this.isInGroup) {
	            this.followdata._allRotationMatrix.appendRotation(this.groupRotation.x, Vector3D.X_AXIS);
	            this.followdata._allRotationMatrix.appendRotation(this.groupRotation.y, Vector3D.Y_AXIS);
	            this.followdata._allRotationMatrix.appendRotation(this.groupRotation.z, Vector3D.Z_AXIS);
	        }
	    }
	    reset() {
	        super.reset();
	        for (var i = 0; i < this.followdata._totalNum; i++) {
	            this._bindMatrixAry[i * 3] = 0;
	            this._bindMatrixAry[i * 3 + 1] = 0;
	            this._bindMatrixAry[i * 3 + 2] = 0;
	            this._bindFlagAry[i] = 0;
	        }
	    }
	    updateWatchCaramMatrix() {
	        this._rotationMatrix.identity();
	        if (this.followdata.facez) {
	            this._rotationMatrix.prependRotation(90, Vector3D.X_AXIS);
	        }
	        else if (this.followdata._watchEye) {
	            this._rotationMatrix.prependRotation(-Scene_data.cam3D.rotationY, Vector3D.Y_AXIS);
	            this._rotationMatrix.prependRotation(-Scene_data.cam3D.rotationX, Vector3D.X_AXIS);
	        }
	    }
	}

	class CombineParticle extends EventDispatcher {
	    constructor() {
	        super();
	        this._maxTime = 1000000;
	        this._rotationX = 0;
	        this._rotationY = 0;
	        this._rotationZ = 0;
	        this.hasMulItem = false;
	        this.sceneVisible = true;
	        this.dynamic = false;
	        this.hasDestory = false;
	        this._displayAry = new Array;
	        this._time = 0;
	        this.bindMatrix = new Matrix3D;
	        this.invertBindMatrix = new Matrix3D;
	        this.bindVecter3d = new Vector3D();
	        this.bindScale = new Vector3D(1, 1, 1);
	        this.groupMatrix = new Matrix3D();
	        this.groupRotationMatrix = new Matrix3D();
	        //this.groupBindMatrix = new Matrix3D();
	    }
	    get displayAry() {
	        return this._displayAry;
	    }
	    set displayAry(value) {
	        this._displayAry = value;
	    }
	    set maxTime(value) {
	        this._maxTime = value;
	    }
	    set bindTarget(value) {
	        this._bindTarget = value;
	        this.invertBindMatrix.isIdentity = false;
	    }
	    set bindSocket(value) {
	        this._bindSocket = value;
	    }
	    set x(value) {
	        this.bindVecter3d.x = value;
	    }
	    set y(value) {
	        this.bindVecter3d.y = value;
	    }
	    set z(value) {
	        this.bindVecter3d.z = value;
	    }
	    get x() {
	        return this.bindVecter3d.x;
	    }
	    get y() {
	        return this.bindVecter3d.y;
	    }
	    get z() {
	        return this.bindVecter3d.z;
	    }
	    setPos($xpos, $ypos, $zpos) {
	        this.bindVecter3d.setTo($xpos, $ypos, $zpos);
	        for (var i = 0; i < this._displayAry.length; i++) {
	            this._displayAry[i].resetPos();
	        }
	    }
	    setMulPos(ary) {
	        for (var i = 0; i < this._displayAry.length; i++) {
	            this._displayAry[i].resetMulPos(ary);
	        }
	    }
	    set scaleX(value) {
	        this.bindScale.x = value;
	    }
	    set scaleY(value) {
	        this.bindScale.y = value;
	    }
	    set scaleZ(value) {
	        this.bindScale.z = value;
	    }
	    set rotationX(value) {
	        this._rotationX = value;
	        this.applyRotation();
	    }
	    set rotationY(value) {
	        this._rotationY = value;
	        this.applyRotation();
	    }
	    set rotationZ(value) {
	        this._rotationZ = value;
	        this.applyRotation();
	    }
	    applyRotation() {
	        this.bindMatrix.identity();
	        this.bindMatrix.appendRotation(this._rotationX, Vector3D.X_AXIS);
	        this.bindMatrix.appendRotation(this._rotationY, Vector3D.Y_AXIS);
	        this.bindMatrix.appendRotation(this._rotationZ, Vector3D.Z_AXIS);
	        this.bindMatrix.copyTo(this.invertBindMatrix);
	        this.invertBindMatrix.invert();
	        this.invertBindMatrix.isIdentity = false;
	    }
	    setGroup($pos, $rotaion, $scale) {
	        this._isInGroup = true;
	        this._groupPos = $pos;
	        this._groupRotation = $rotaion;
	        this._groupScale = $scale;
	        this.groupMatrix.isIdentity = false;
	        this.groupMatrix.identity();
	        this.groupMatrix.appendScale($scale.x, $scale.y, $scale.z);
	        this.groupMatrix.appendRotation($rotaion.x, Vector3D.X_AXIS);
	        this.groupMatrix.appendRotation($rotaion.y, Vector3D.Y_AXIS);
	        this.groupMatrix.appendRotation($rotaion.z, Vector3D.Z_AXIS);
	        this.groupMatrix.appendTranslation($pos.x, $pos.y, $pos.z);
	        this.groupRotationMatrix.isIdentity = false;
	        this.groupRotationMatrix.identity();
	        this.groupRotationMatrix.prependRotation($rotaion.z, Vector3D.Z_AXIS);
	        this.groupRotationMatrix.prependRotation($rotaion.y, Vector3D.Y_AXIS);
	        this.groupRotationMatrix.prependRotation($rotaion.x, Vector3D.X_AXIS);
	    }
	    setDataByte(byte) {
	        byte.position = 0;
	        var version = byte.readInt();
	        var len = byte.readInt();
	        //this._sourceComNum = 0;
	        this._maxTime = 0;
	        //this._sourceAllNum = len;
	        this._displayAry = new Array;
	        for (var i = 0; i < len; i++) {
	            var $particleType = byte.readInt();
	            var display3D = this.getDisplay3DById($particleType);
	            display3D.setAllByteInfo(byte, version);
	            display3D.setBind(this.bindVecter3d, this.bindMatrix, this.bindScale, this.invertBindMatrix, this.groupMatrix);
	            this._displayAry.push(display3D);
	            if (display3D.timeline.maxFrameNum > this._maxTime) {
	                this._maxTime = display3D.timeline.maxFrameNum;
	            }
	        }
	        this._maxTime *= Scene_data.frameTime;
	    }
	    addPrticleItem($dis) {
	        $dis.visible = false;
	        $dis.setBind(this.bindVecter3d, this.bindMatrix, this.bindScale, this.invertBindMatrix, this.groupMatrix);
	        this._displayAry.push($dis);
	    }
	    getDisplay3DById(particleType) {
	        var diaplayInfo = new Object;
	        diaplayInfo.particleType = particleType;
	        return this.getDisplay3D(diaplayInfo);
	    }
	    /*   public setData(ary: Array<any>): void {
	          //this._sourceComNum = 0;
	          //this._sourceAllNum = ary.length;
	          this._displayAry = new Array;
	          this._maxTime = 0;
	  
	          for (var i: number = 0; i < ary.length; i++) {
	              var diaplayInfo: Object = ary[i].display;
	  
	              var display3D: Display3DParticle = this.getDisplay3D(diaplayInfo);
	              //display3D.setAllInfo(ary[i]);
	              display3D.setBind(this.bindVecter3d, this.bindMatrix, this.bindScale, this.invertBindMatrix, this.groupMatrix);
	  
	              //display3D.addEventListener(EngineEvent.COMPLETE, this.onSourceLoadCom, this);
	  
	              //display3D.bindTarget = _bindTarget;
	              //display3D.bindSocket = _bindSocket;
	  
	              //display3D.setAllInfo(diaplayInfo);
	  
	              //display3D.priority = priority;
	  
	              //display3D.outVisible = this._visible;
	  
	              //display3D.isInGroup = _isInGroup;
	              //display3D.groupPos = _groupPos;
	              //display3D.groupRotation = _groupRotation;
	              //display3D.groupScale = _groupScale;
	  
	              this._displayAry.push(display3D);
	  
	              if (display3D.timeline.maxFrameNum > this._maxTime) {
	                  this._maxTime = display3D.timeline.maxFrameNum;
	              }
	  
	          }
	  
	          this._maxTime *= Scene_data.frameTime;
	  
	  
	          //updateMatrix();
	  
	          //updateBind();
	  
	          //if (_hasStage) {
	          //    addToRender();
	          //}
	  
	          //maxTime = getMaxNum();
	          //_hasData = true;
	          //if (_cloneList) {//如果有对应的克隆队列
	          //    for (i = 0; i < _cloneList.length; i++) {
	          //        _cloneList[i].cloneData(this);
	          //    }
	          //    _cloneList.length = 0;
	          //    _cloneList = null;
	          //}
	  
	          //if (_hasRealDispose) {
	          //    realDispose();
	          //}
	  
	      } */
	    updateTime(t) {
	        this._time += t;
	        if (!this._displayAry) {
	            return;
	        }
	        for (var i = 0; i < this._displayAry.length; i++) {
	            this._displayAry[i].updateTime(this._time);
	        }
	        this.updateBind();
	        if (this._time >= this._maxTime) {
	            this.dispatchEvent(new BaseEvent(BaseEvent.COMPLETE));
	        }
	    }
	    updateBind() {
	        if (this._bindTarget) {
	            this._bindTarget.getSocket(this._bindSocket, this.bindMatrix);
	            this.bindVecter3d.setTo(this.bindMatrix.x, this.bindMatrix.y, this.bindMatrix.z);
	            this.bindMatrix.identityPostion();
	            if (!this.groupRotationMatrix.isIdentity) {
	                this.bindMatrix.copyTo(this.invertBindMatrix);
	                this.invertBindMatrix.prepend(this.groupRotationMatrix);
	                this.invertBindMatrix.invert();
	            }
	            else {
	                this.bindMatrix.invertToMatrix(this.invertBindMatrix);
	            }
	            //if (this.hasMulItem){
	            //    if (this._bindTarget.getSunType() == 1){
	            //        var bt: any = this._bindTarget;
	            //        if (typeof bt.getMulSocket == 'function') {
	            //            for (var i: number = 0; i < this._displayAry.length; i++) {
	            //                bt.getMulSocket(this._displayAry[i].getMulBindList());
	            //            }
	            //        }
	            //    }
	            //}
	        }
	    }
	    reset() {
	        this._time = 0;
	        for (var i = 0; i < this._displayAry.length; i++) {
	            this._displayAry[i].reset();
	        }
	    }
	    update() {
	        if (!this.sceneVisible) {
	            return;
	        }
	        if (!this._displayAry) {
	            return;
	        }
	        for (var i = 0; i < this._displayAry.length; i++) {
	            this._displayAry[i].update();
	        }
	    }
	    updateItem(idx) {
	        if (!this.sceneVisible) {
	            return;
	        }
	        if (this.hasDestory) {
	            return;
	        }
	        let particle = this._displayAry[idx];
	        if (!particle) ;
	        else {
	            particle.update();
	        }
	    }
	    get size() {
	        if (!this._displayAry) {
	            return 0;
	        }
	        return this._displayAry.length;
	    }
	    //private onSourceLoadCom(event: BaseEvent): void {
	    //    //console.log(event.type);
	    //    event.target.removeEventListener(BaseEvent.COMPLETE, this.onSourceLoadCom, this);
	    //}
	    getDisplay3D(obj) {
	        var types = obj.particleType;
	        var display3D;
	        switch (types) {
	            case 1:
	                {
	                    display3D = new Display3DFacetParticle();
	                    break;
	                }
	            case 18:
	                {
	                    display3D = new Display3DBallPartilce();
	                    break;
	                }
	            case 3:
	                {
	                    display3D = new Display3DLocusPartilce();
	                    break;
	                }
	            case 14:
	                {
	                    display3D = new Display3DLocusBallPartilce();
	                    break;
	                }
	            case 9:
	                {
	                    display3D = new Display3DModelObjParticle();
	                    break;
	                }
	            case 4:
	                {
	                    display3D = new Display3DModelPartilce();
	                    break;
	                }
	            case 7:
	                {
	                    display3D = new Display3dModelAnimParticle();
	                    break;
	                }
	            case 8:
	                {
	                    display3D = new Display3DFollowPartilce();
	                    break;
	                }
	            // case 12:
	            //     {
	            //         display3D = new Display3DFollowLocusPartilce();
	            //         break;
	            //     }
	            //case 22:
	            //    {
	            //        display3D = new Display3DFollowMulLocusParticle();
	            //        this.hasMulItem = true;
	            //        break;
	            //    }
	        }
	        display3D.visible = false;
	        return display3D;
	    }
	    destory() {
	        if (this.sourceData) {
	            this.sourceData.useNum--;
	        }
	        for (var i = 0; i < this._displayAry.length; i++) {
	            this._displayAry[i].destory();
	        }
	        this._displayAry.length = 0;
	        this._displayAry = null;
	        this.bindMatrix = null;
	        this.bindVecter3d = null;
	        this.bindScale = null;
	        this.invertBindMatrix = null;
	        this._bindTarget = null;
	        this._bindSocket = null;
	        this._groupPos = null;
	        this._groupRotation = null;
	        this._groupScale = null;
	        this.groupMatrix = null;
	        this.groupRotationMatrix = null;
	        this.hasDestory = true;
	    }
	}

	class Display3DFollowLocusPartilce extends Display3DParticle {
	    constructor() {
	        super();
	        this.flag = 0;
	        //this.objData = new ParticleGpuData();
	        this._caramPosVec = [0, 0, 0];
	    }
	    get followlocusdata() {
	        return this.data;
	    }
	    creatData() {
	        this.data = new ParticleFollowLocusData;
	    }
	    // public setAllByteInfo($byte: ByteArray, version: number = 0): void {
	    //     super.setAllByteInfo($byte, version);
	    //     this.initBindMatrixAry();
	    // }
	    onCreated() {
	        this.initBindMatrixAry();
	    }
	    initBindMatrixAry() {
	        this._bindPosAry = new Array;
	        this._gpuVc = new Float32Array(this.followlocusdata._fenduanshu * 6);
	        for (var i = 0; i <= this.followlocusdata._fenduanshu; i++) {
	            this._bindPosAry.push([0, 0, 5 * i]);
	            this._bindPosAry.push([0, 0, 1]);
	        }
	    }
	    setVa() {
	        var tf = Scene_data.context3D.pushVa(this.data.objData.vertexBuffer);
	        if (!tf) {
	            Scene_data.context3D.setVaOffset(0, 3, this.data.objData.stride, 0);
	            Scene_data.context3D.setVaOffset(1, 2, this.data.objData.stride, 12);
	        }
	        // Scene_data.context3D.setVa(0, 3, this.data.objData.vertexBuffer);
	        // Scene_data.context3D.setVa(1, 2, this.data.objData.uvBuffer);
	        this.setMaterialTexture();
	        Scene_data.context3D.drawCall(this.data.objData.indexBuffer, this.data.objData.treNum);
	    }
	    setVc() {
	        this.updateMatrix();
	        this.updateBind();
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	        this.data.vcmatData.set(Scene_data.viewMatrx3D.m, 0);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        this.data.vcmatData.set(Scene_data.cam3D.cameraMatrix.m, 16);
	        this._caramPosVec[0] = Scene_data.cam3D.x;
	        this._caramPosVec[1] = Scene_data.cam3D.y;
	        this._caramPosVec[2] = Scene_data.cam3D.z;
	        //Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "camPos", this._caramPosVec);
	        this.data.vcmatData.set(this._caramPosVec, 32);
	        Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "vcmat", this.data.vcmatData);
	        this.setBindPosVc();
	        this.setMaterialVc();
	    }
	    setBindPosVc() {
	        for (var i = 0; i < this._bindPosAry.length; i++) {
	            Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "bindpos[" + i + "]", this._bindPosAry[i]);
	        }
	    }
	    reset() {
	        this.resetPos();
	        super.reset();
	    }
	    updateMatrix() {
	        this.modelMatrix.identity();
	        this.modelMatrix.prepend(this.posMatrix);
	    }
	    resetPos() {
	        for (var i = 0; i < this._bindPosAry.length; i += 2) {
	            this._bindPosAry[i][0] = this.bindVecter3d.x;
	            this._bindPosAry[i][1] = this.bindVecter3d.y;
	            this._bindPosAry[i][2] = this.bindVecter3d.z;
	        }
	        this.flag = TimeUtil.getTimer();
	    }
	    updateBind() {
	        var ctime = TimeUtil.getTimer();
	        if ((ctime - this.flag) >= Display3DFollowLocusPartilce.waitCdTime) {
	            var normal = this._bindPosAry.pop();
	            var pos = this._bindPosAry.pop();
	            pos[0] = this.bindVecter3d.x;
	            pos[1] = this.bindVecter3d.y;
	            pos[2] = this.bindVecter3d.z;
	            var pos0 = this._bindPosAry[0];
	            var normal0 = this._bindPosAry[1];
	            var v3d = new Vector3D(pos[0] - pos0[0], pos[1] - pos0[1], pos[2] - pos0[2]);
	            v3d.normalize();
	            normal0[0] = v3d.x;
	            normal[0] = v3d.x;
	            normal0[1] = v3d.y;
	            normal[1] = v3d.y;
	            normal0[2] = v3d.z;
	            normal[2] = v3d.z;
	            this._bindPosAry.unshift(normal);
	            this._bindPosAry.unshift(pos);
	            this.flag = ctime;
	        }
	    }
	}
	Display3DFollowLocusPartilce.waitCdTime = 35;

	class Display3DFollowLocusShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "v2TexCoord");
	    }
	    getMat4Str(key) {
	        //return key;
	        return "vcmat[" + Display3DFollowLocusShader.shader_mat4[key] + "]";
	    }
	    getVec4Str(key) {
	        //return key;
	        return "vcmat[" + Display3DFollowLocusShader.shader_vec4[key][0] + "][" + Display3DFollowLocusShader.shader_vec4[key][1] + "]";
	    }
	    static getVcSize() {
	        return 3;
	    }
	    getVertexShaderString() {
	        var defineBaseStr = "attribute vec3 v3Position;\n" +
	            "attribute vec2 v2TexCoord;\n" +
	            "uniform mat4 vcmat[" + Display3DFacetShader.getVcSize() + "];\n" + //所有vc值
	            // "uniform mat4 viewMatrix3D;\n" +
	            // "uniform mat4 camMatrix3D;\n" +
	            // "uniform vec3 camPos;\n" +
	            "uniform vec3 bindpos[30];\n" +
	            "varying vec2 v0;\n";
	        var watchPosStr = "   vec3 cpos = bindpos[int(v3Position.x)];\n" +
	            "   vec3 mulPos = normalize(vec3(" + this.getVec4Str("camPos") + ".xyz) - cpos);\n" +
	            "   vec3 normals = bindpos[int(v3Position.y)];\n" +
	            "   mulPos = cross(mulPos, normals);\n" +
	            "   mulPos = normalize(mulPos);\n" +
	            "   mulPos *= v3Position.z;\n" +
	            "   cpos += mulPos;\n" +
	            "   gl_Position = " + this.getMat4Str("viewMatrix3D") + "  * " + this.getMat4Str("camMatrix3D") + " * vec4(cpos,1.0);\n";
	        var uvStr = "v0 = v2TexCoord;\n";
	        var resultAllStr = defineBaseStr + "void main(){\n" + watchPosStr + uvStr + "}";
	        return resultAllStr;
	    }
	    getFragmentShaderString() {
	        var $str = " precision mediump float;\n" +
	            "uniform sampler2D tex;\n" +
	            "varying vec2 v0;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(tex, v0.xy);\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	Display3DFollowLocusShader.Display3D_FollowLocus_Shader = "Display3DFollowLocusShader";
	Display3DFollowLocusShader.shader_mat4 = { viewMatrix3D: 0, camMatrix3D: 1 };
	Display3DFollowLocusShader.shader_vec4 = { camPos: [2, 0] };

	class ParticleFollowLocusData extends ParticleData {
	    getParticle() {
	        return new Display3DFollowLocusPartilce;
	    }
	    setAllByteInfo($byte) {
	        this._fenduanshu = $byte.readFloat();
	        super.setAllByteInfo($byte);
	        //this.initBindMatrixAry();
	        this.uploadGpu();
	        this.initVcData();
	    }
	    uploadGpu() {
	        this.objData = new ObjData;
	        this.objData.vertices = new Array;
	        this.objData.uvs = new Array;
	        this.objData.indexs = new Array;
	        for (var i = 0; i <= this._fenduanshu; i++) {
	            var pA = new Vector2D(i / this._fenduanshu, 0);
	            var pB = new Vector2D(i / this._fenduanshu, 1);
	            pA.scaleBy(0.9);
	            pB.scaleBy(0.9);
	            if (this._isU) {
	                pA.x = -pA.x;
	                pB.x = -pB.x;
	            }
	            if (this._isV) {
	                pA.y = -pA.y;
	                pB.y = -pB.y;
	            }
	            var vcIndex = i * 2;
	            this.objData.vertices.push(vcIndex, vcIndex + 1, -this._originWidthScale * this._width / 100);
	            if (this._isUV) {
	                this.objData.vertices.push(pA.y, pA.x);
	            }
	            else {
	                this.objData.vertices.push(pA.x, pA.y);
	            }
	            this.objData.vertices.push(vcIndex, vcIndex + 1, (1 - this._originWidthScale) * this._width / 100);
	            if (this._isUV) {
	                this.objData.vertices.push(pB.y, pB.x);
	            }
	            else {
	                this.objData.vertices.push(pB.x, pB.y);
	            }
	            // if (this._isUV) {
	            //     this.objData.uvs.push(pA.y, pA.x);
	            //     this.objData.uvs.push(pB.y, pB.x);
	            // } else {
	            //     this.objData.uvs.push(pA.x, pA.y);
	            //     this.objData.uvs.push(pB.x, pB.y);
	            // }
	        }
	        for (i = 0; i < this._fenduanshu; i++) {
	            this.objData.indexs.push(0 + 2 * i, 1 + 2 * i, 2 + 2 * i, 1 + 2 * i, 3 + 2 * i, 2 + 2 * i);
	        }
	        this.pushToGpu();
	    }
	    pushToGpu() {
	        this.objData.vertexBuffer = Scene_data.context3D.uploadBuff3D(this.objData.vertices);
	        //this.objData.uvBuffer = Scene_data.context3D.uploadBuff3D(this.objData.uvs);
	        this.objData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(this.objData.indexs);
	        this.objData.stride = 5 * 4;
	        this.objData.treNum = this.objData.indexs.length;
	    }
	    initVcData() {
	        this.vcmatData = new Float32Array(Display3DFollowLocusShader.getVcSize() * 16);
	    }
	    regShader() {
	        if (!this.materialParam) {
	            return;
	        }
	        var shader = new Display3DFollowLocusShader();
	        this.materialParam.shader = ProgramManager.getInstance().getMaterialProgram(Display3DFollowLocusShader.Display3D_FollowLocus_Shader, Display3DFollowLocusShader, this.materialParam.material);
	        this.materialParam.program = this.materialParam.shader.program;
	    }
	}

	class Display3DBoneShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "pos");
	        $context.bindAttribLocation(this.program, 1, "v2uv");
	        $context.bindAttribLocation(this.program, 2, "boneWeight");
	        $context.bindAttribLocation(this.program, 3, "boneID");
	    }
	    getMat4Str(key) {
	        //return key;
	        return "vcmat[" + Display3DBoneShader.shader_mat4[key] + "]";
	    }
	    static getVcSize() {
	        return 3;
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec3 pos;" +
	            "attribute vec2 v2uv;" +
	            "attribute vec4 boneWeight;" +
	            "attribute vec4 boneID;" +
	            "uniform vec4 boneQ[54];\n" +
	            "uniform vec3 boneD[54];\n" +
	            "uniform mat4 vcmat[" + Display3DBoneShader.getVcSize() + "];\n" + //所有vc值
	            //"uniform mat4 viewMatrix3D;\n" +
	            //"uniform mat4 camMatrix3D;\n" +
	            //"uniform mat4 posMatrix3D;\n" +
	            "varying vec2 v0;\n" +
	            MaterialAnimShader.getMd5M44Str() +
	            "void main(void)" +
	            "{" +
	            "v0 = v2uv;\n" +
	            "vec4 vt0 = getQDdata(vec3(pos.x,pos.y,pos.z));\n" +
	            " gl_Position = " + this.getMat4Str("viewMatrix3D") + " * " + this.getMat4Str("camMatrix3D") + " *" + this.getMat4Str("posMatrix3D") + "* vt0;" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = "precision mediump float;\n" +
	            "varying vec2 v0;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "gl_FragColor = vec4(1.0,0.0,1.0,1.0);\n" +
	            "}";
	        return $str;
	    }
	}
	Display3DBoneShader.Display3DBoneShader = "Display3DBoneShader";
	Display3DBoneShader.shader_mat4 = { viewMatrix3D: 0, camMatrix3D: 1, posMatrix3D: 2 };
	class Display3DBonePartilce extends Display3DParticle {
	    constructor() {
	        super();
	        this.skipNum = 0;
	    }
	    get modeldata() {
	        return this.data;
	    }
	    creatData() {
	        this.data = new ParticleBoneData;
	    }
	    update() {
	        Scene_data.context3D.setWriteDepth(false);
	        super.update();
	        //   Scene_data.context3D.setWriteDepth(false);
	    }
	    setVc() {
	        var currentFrame = Util.float2int((this._time / Scene_data.frameTime) / 2);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	        //this.data.setFloat32Mat("viewMatrix3D", Scene_data.viewMatrx3D.m);
	        this.data.vcmatData.set(Scene_data.viewMatrx3D.m, 0);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        //this.data.setFloat32Mat("camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        this.data.vcmatData.set(Scene_data.cam3D.cameraMatrix.m, 16);
	        //Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "posMatrix3D", this.modelMatrix.m);
	        //this.data.setFloat32Mat("posMatrix3D", this.modelMatrix.m);
	        this.data.vcmatData.set(this.modelMatrix.m, 32);
	        Scene_data.context3D.setVcMatrix4fv(this.data.materialParam.shader, "vcmat", this.data.vcmatData);
	        var $frameDualQuat = this.modeldata.animData.boneQPAry[0];
	        var $frameLen = $frameDualQuat.length;
	        var $frameId = currentFrame % $frameLen;
	        /*
	        for (var i: number = 0; i < this.modeldata.boneQDitem[$frameId].length; i++) {
	            var $dq: ObjectBone = this.modeldata.boneQDitem[$frameId][i]
	 
	            Scene_data.context3D.setVc4fv(this.data.materialParam.program, "boneQ[" + i + "]", [$dq.qx, $dq.qy, $dq.qz, $dq.qw]);
	            Scene_data.context3D.setVc3fv(this.data.materialParam.program, "boneD[" + i + "]", [$dq.tx, $dq.ty, $dq.tz]);
	        }
	        */
	        var $dualQuatFrame = $frameDualQuat[$frameId];
	        Scene_data.context3D.setVc4fv(this.data.materialParam.shader, "boneQ", $dualQuatFrame.quat); //旋转
	        Scene_data.context3D.setVc3fv(this.data.materialParam.shader, "boneD", $dualQuatFrame.pos); //所有的位移
	        this.setMaterialVc();
	    }
	    setVa() {
	        var tf = Scene_data.context3D.pushVa(this.modeldata.meshData.vertexBuffer);
	        if (!tf) {
	            Scene_data.context3D.setVaOffset(0, 3, this.modeldata.meshData.stride, 0);
	            Scene_data.context3D.setVaOffset(1, 2, this.modeldata.meshData.stride, 12);
	            Scene_data.context3D.setVaOffset(3, 4, this.modeldata.meshData.stride, 20);
	            Scene_data.context3D.setVaOffset(2, 4, this.modeldata.meshData.stride, 36);
	        }
	        // Scene_data.context3D.setVa(0, 3, this.modeldata.meshData.vertexBuffer);
	        // Scene_data.context3D.setVa(1, 2, this.modeldata.meshData.uvBuffer);
	        // Scene_data.context3D.setVa(2, 4, this.modeldata.meshData.boneWeightBuffer);
	        // Scene_data.context3D.setVa(3, 4, this.modeldata.meshData.boneIdBuffer);
	        this.setMaterialTexture();
	        Scene_data.context3D.drawCall(this.modeldata.meshData.indexBuffer, this.modeldata.meshData.treNum);
	    }
	}

	class MeshData extends ObjData {
	    constructor() {
	        super(...arguments);
	        this.boneIDAry = new Array;
	        this.boneWeightAry = new Array;
	        this.boneNewIDAry = new Array; //skeleton
	        this.particleAry = new Array;
	    }
	    getBindPosMatrix() {
	        var ary = new Array;
	        var invertAry = new Array;
	        for (var i = 0; i < this.bindPosAry.length; i++) {
	            var objbone = this.bindPosAry[i];
	            var OldQ = new Quaternion(objbone[0], objbone[1], objbone[2]);
	            OldQ.setMd5W();
	            var newM = OldQ.toMatrix3D();
	            newM.appendTranslation(objbone[3], objbone[4], objbone[5]);
	            invertAry.push(newM.clone());
	            newM.invert();
	            ary.push(newM);
	        }
	        this.bindPosMatrixAry = ary;
	        this.bindPosInvertMatrixAry = invertAry;
	    }
	    destory() {
	        super.destory();
	        if (this.materialParam) {
	            this.materialParam.destory();
	            this.materialParam = null;
	            this.materialParamData = null;
	        }
	        this.boneIDAry.length = 0;
	        this.boneWeightAry.length = 0;
	        this.boneNewIDAry.length = 0;
	        this.boneIDAry = null;
	        this.boneWeightAry = null;
	        this.boneNewIDAry = null;
	        if (this.boneWeightBuffer) {
	            Scene_data.context3D.deleteBuffer(this.boneWeightBuffer);
	            this.boneWeightBuffer = null;
	        }
	        if (this.boneIdBuffer) {
	            Scene_data.context3D.deleteBuffer(this.boneIdBuffer);
	            this.boneIdBuffer = null;
	        }
	        if (this.material) {
	            this.material.clearUseNum();
	        }
	        this.particleAry.length = 0;
	        this.particleAry = null;
	        //for (){
	        //}
	    }
	}
	class BindParticle {
	    //public particle: CombineParticle;
	    constructor($url, $socketName) {
	        this.url = $url;
	        this.socketName = $socketName;
	    }
	}

	class Dictionary {
	    constructor(init) {
	        this._keys = new Array;
	        this._values = new Array;
	        for (var x = 0; init && x < init.length; x++) {
	            this[init[x].key] = init[x].value;
	            this._keys.push(init[x].key);
	            this._values.push(init[x].value);
	        }
	    }
	    add(key, value) {
	        this[key] = value;
	        this._keys.push(key);
	        this._values.push(value);
	    }
	    has(key) {
	        if (this[key]) {
	            return true;
	        }
	        else {
	            return false;
	        }
	    }
	    remove(key) {
	        var index = this._keys.indexOf(key, 0);
	        this._keys.splice(index, 1);
	        this._values.splice(index, 1);
	        delete this[key];
	    }
	    keys() {
	        return this._keys;
	    }
	    values() {
	        return this._values;
	    }
	    containsKey(key) {
	        if (typeof this[key] === "undefined") {
	            return false;
	        }
	        return true;
	    }
	    toLookup() {
	        return this;
	    }
	}

	class DualQuatFloat32Array {
	}
	//AnimClip
	class AnimData {
	    constructor() {
	        this.inLoop = 0;
	        this.inter = new Array;
	        this.bounds = new Array;
	        this.nameHeight = 0;
	        this.posAry = new Array;
	        this.hasProcess = false;
	    }
	    processMesh($skinMesh) {
	        if (this.hasProcess) {
	            //console.log("has process logic error");
	            return;
	        }
	        this.makeArrBoneQPAry($skinMesh);
	        this.hasProcess = true;
	    }
	    makeArrBoneQPAry($skinMesh) {
	        this.meshBoneQPAryDic = new Dictionary([]);
	        for (var k = 0; k < $skinMesh.meshAry.length; k++) {
	            var $conleM = this.conleMatrixArr();
	            for (var i = 0; i < $conleM.length; i++) {
	                var frameAry = $conleM[i];
	                for (var j = 0; j < frameAry.length; j++) {
	                    if ($skinMesh.meshAry[k].bindPosMatrixAry[j]) {
	                        frameAry[j].prepend($skinMesh.meshAry[k].bindPosMatrixAry[j]);
	                    }
	                }
	            }
	            var temp = this.makeFrameDualQuatFloatArray($skinMesh, $conleM);
	            this.meshBoneQPAryDic[$skinMesh.meshAry[k].uid] = temp;
	            this.boneQPAry = temp; //存一下到原来数据中
	        }
	        this.matrixAry = $conleM; //将最后一个回传给插孔
	    }
	    getBoneQPAryByMesh($mesh) {
	        return this.meshBoneQPAryDic[$mesh.uid];
	    }
	    conleMatrixArr() {
	        var $arr = new Array();
	        for (var i = 0; i < this.matrixAry.length; i++) {
	            var frameAry = this.matrixAry[i];
	            var temp = new Array();
	            for (var j = 0; j < frameAry.length; j++) {
	                temp.push(frameAry[j].clone());
	            }
	            $arr.push(temp);
	        }
	        return $arr;
	    }
	    makeFrameDualQuatFloatArray($skinMesh, $matrixAry) {
	        var $backArr = new Array();
	        var tempMatrix = new Matrix3D();
	        for (var i = 0; i < $skinMesh.meshAry.length; i++) {
	            var $frameDualQuat = new Array;
	            var newIDBoneArr = $skinMesh.meshAry[i].boneNewIDAry;
	            for (var j = 0; j < $matrixAry.length; j++) {
	                var baseBone = $matrixAry[j];
	                var $DualQuatFloat32Array = new DualQuatFloat32Array;
	                $DualQuatFloat32Array.quat = new Float32Array(newIDBoneArr.length * 4);
	                $DualQuatFloat32Array.pos = new Float32Array(newIDBoneArr.length * 3);
	                for (var k = 0; k < newIDBoneArr.length; k++) {
	                    var $m = baseBone[newIDBoneArr[k]].clone(tempMatrix);
	                    $m.appendScale(-1, 1, 1); //特别标记，因为四元数和矩阵运算结果不一
	                    var $q = new Quaternion();
	                    $q.fromMatrix($m);
	                    var $p = $m.position;
	                    $DualQuatFloat32Array.quat[k * 4 + 0] = $q.x;
	                    $DualQuatFloat32Array.quat[k * 4 + 1] = $q.y;
	                    $DualQuatFloat32Array.quat[k * 4 + 2] = $q.z;
	                    $DualQuatFloat32Array.quat[k * 4 + 3] = $q.w;
	                    $DualQuatFloat32Array.pos[k * 3 + 0] = $p.x;
	                    $DualQuatFloat32Array.pos[k * 3 + 1] = $p.y;
	                    $DualQuatFloat32Array.pos[k * 3 + 2] = $p.z;
	                }
	                $frameDualQuat.push($DualQuatFloat32Array);
	            }
	            $backArr.push($frameDualQuat);
	        }
	        return $backArr;
	    }
	}

	class ParticleBoneData extends ParticleData {
	    constructor() {
	        super(...arguments);
	        this.objScale = 1;
	    }
	    getParticle() {
	        return new Display3DBonePartilce();
	    }
	    destory() {
	        super.destory();
	        //this.timelineData.destory();
	        //this.timelineData = null;
	        this.meshData.destory();
	        this.animData = null;
	    }
	    setAllByteInfo($byte) {
	        this.meshData = new MeshData();
	        this.animData = new AnimData();
	        this.objScale = $byte.readFloat();
	        var dataWidth = 13;
	        var len = $byte.getInt();
	        len *= dataWidth * 4;
	        var arybuff = new ArrayBuffer(len);
	        var data = new DataView(arybuff);
	        BaseRes.readBytes2ArrayBuffer($byte, data, 3, 0, dataWidth); //vertices
	        BaseRes.readBytes2ArrayBuffer($byte, data, 2, 3, dataWidth); //uvs
	        BaseRes.readIntForTwoByte($byte, this.meshData.indexs);
	        BaseRes.readBytes2ArrayBuffer($byte, data, 4, 5, dataWidth, 2); //boneIDAry
	        BaseRes.readBytes2ArrayBuffer($byte, data, 4, 9, dataWidth, 3); //boneWeightAry
	        this.meshData.stride = dataWidth * 4;
	        // BaseRes.readFloatTwoByte($byte, this.meshData.vertices)
	        // //console.log($byte.position);
	        // BaseRes.readFloatTwoByte($byte, this.meshData.uvs)
	        // //console.log($byte.position);
	        // BaseRes.readIntForTwoByte($byte, this.meshData.indexs);
	        // //console.log($byte.position);
	        // var numLength: number = $byte.readInt();
	        // this.meshData.boneIDAry = new Array
	        // for (var j: number = 0; j < numLength; j++) {
	        //     this.meshData.boneIDAry.push($byte.readByte())
	        // }
	        // //console.log($byte.position);
	        // numLength = $byte.readInt();
	        // this.meshData.boneWeightAry = new Array
	        // for (var j: number = 0; j < numLength; j++) {
	        //     this.meshData.boneWeightAry.push(($byte.readByte() + 128) / 255);
	        // }
	        // //console.log($byte.position);
	        this.readFrameQua($byte);
	        ////console.log($byte.position);
	        super.setAllByteInfo($byte);
	        //this.uploadGpu();
	        this.initVcData();
	        this.meshData.vertexBuffer = Scene_data.context3D.uploadBuff3DArrayBuffer(arybuff);
	        this.meshData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(this.meshData.indexs);
	        this.meshData.treNum = this.meshData.indexs.length;
	    }
	    initVcData() {
	        this.vcmatData = new Float32Array(Display3DBoneShader.getVcSize() * 16);
	    }
	    setFloat32Mat(key, ary) {
	        var idx = Display3DBoneShader.shader_mat4[key] * 16;
	        this.vcmatData.set(ary, idx);
	    }
	    readFrameQua($byte) {
	        var $tempNum = $byte.readFloat();
	        var $RGB32767 = 32767;
	        var $frameNum = $byte.readInt();
	        var $frameDualQuat = new Array;
	        for (var i = 0; i < $frameNum; i++) {
	            var $len = $byte.readInt();
	            var $DualQuatFloat32Array = new DualQuatFloat32Array;
	            $DualQuatFloat32Array.quat = new Float32Array($len * 4);
	            $DualQuatFloat32Array.pos = new Float32Array($len * 3);
	            for (var j = 0; j < $len; j++) {
	                $DualQuatFloat32Array.quat[j * 4 + 0] = $byte.readShort() / $RGB32767;
	                $DualQuatFloat32Array.quat[j * 4 + 1] = $byte.readShort() / $RGB32767;
	                $DualQuatFloat32Array.quat[j * 4 + 2] = $byte.readShort() / $RGB32767;
	                $DualQuatFloat32Array.quat[j * 4 + 3] = $byte.readShort() / $RGB32767;
	                $DualQuatFloat32Array.pos[j * 3 + 0] = $byte.readShort() / $RGB32767 * $tempNum;
	                $DualQuatFloat32Array.pos[j * 3 + 1] = $byte.readShort() / $RGB32767 * $tempNum;
	                $DualQuatFloat32Array.pos[j * 3 + 2] = $byte.readShort() / $RGB32767 * $tempNum;
	            }
	            $frameDualQuat.push($DualQuatFloat32Array);
	        }
	        this.animData.boneQPAry = new Array;
	        this.animData.boneQPAry.push($frameDualQuat);
	    }
	    uploadGpu() {
	        this.uploadMesh(this.meshData);
	    }
	    uploadMesh($mesh) {
	        $mesh.vertexBuffer = Scene_data.context3D.uploadBuff3D($mesh.vertices);
	        $mesh.uvBuffer = Scene_data.context3D.uploadBuff3D($mesh.uvs);
	        $mesh.boneIdBuffer = Scene_data.context3D.uploadBuff3D($mesh.boneIDAry);
	        $mesh.boneWeightBuffer = Scene_data.context3D.uploadBuff3D($mesh.boneWeightAry);
	        $mesh.indexBuffer = Scene_data.context3D.uploadIndexBuff3D($mesh.indexs);
	        $mesh.treNum = $mesh.indexs.length;
	    }
	    regShader() {
	        this.materialParam.shader = ProgramManager.getInstance().getMaterialProgram(Display3DBoneShader.Display3DBoneShader, Display3DBoneShader, this.materialParam.material);
	        this.materialParam.program = this.materialParam.shader.program;
	    }
	}

	class CombineParticleData extends ResCount {
	    destory() {
	        for (var i = 0; i < this.dataAry.length; i++) {
	            this.dataAry[i].destory();
	        }
	    }
	    getCombineParticle() {
	        var particle = new CombineParticle();
	        particle.maxTime = this.maxTime;
	        for (var i = 0; i < this.dataAry.length; i++) {
	            var display = this.dataAry[i].creatPartilce();
	            particle.addPrticleItem(display);
	        }
	        particle.sourceData = this;
	        this.useNum++;
	        return particle;
	    }
	    setDataByte(byte) {
	        byte.position = 0;
	        var version = byte.readInt();
	        var len = byte.readInt();
	        this.maxTime = 0;
	        this.dataAry = new Array;
	        for (var i = 0; i < len; i++) {
	            var $particleType = byte.readInt();
	            var pdata = this.getParticleDataType($particleType);
	            pdata.version = version;
	            pdata.setAllByteInfo(byte);
	            this.dataAry.push(pdata);
	            if (pdata.timelineData.maxFrameNum > this.maxTime) {
	                this.maxTime = pdata.timelineData.maxFrameNum;
	            }
	        }
	        this.maxTime *= Scene_data.frameTime;
	    }
	    getParticleDataType($type) {
	        var pdata;
	        switch ($type) {
	            case 1:
	                {
	                    pdata = new ParticleFacetData();
	                    break;
	                }
	            case 18:
	                {
	                    pdata = new ParticleBallData();
	                    break;
	                }
	            case 3:
	                {
	                    pdata = new ParticleLocusData();
	                    break;
	                }
	            case 14:
	                {
	                    pdata = new ParticleLocusballData();
	                    break;
	                }
	            case 9:
	            case 4:
	            case 7:
	                {
	                    pdata = new ParticleModelData();
	                    break;
	                }
	            case 8:
	                {
	                    pdata = new ParticleFollowData();
	                    break;
	                }
	            case 12:
	                {
	                    pdata = new ParticleFollowLocusData();
	                    break;
	                }
	            case 13:
	                {
	                    pdata = new ParticleBoneData();
	                    break;
	                }
	        }
	        return pdata;
	    }
	}

	class ParticleManager extends ResGC {
	    constructor() {
	        super();
	        this._time = 0;
	        this.renderDic = new Object;
	        this._particleList = new Array;
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new ParticleManager();
	        }
	        return this._instance;
	    }
	    getParticleByte($url) {
	        $url = $url.replace("_byte.txt", ".txt");
	        $url = $url.replace(".txt", "_byte.txt");
	        var combineParticle = new CombineParticle();
	        var url = $url;
	        if (this._dic[url]) {
	            var baseData = this._dic[url];
	            combineParticle = baseData.getCombineParticle();
	        }
	        // else {
	        //     LoadManager.getInstance().load(url, LoadManager.BYTE_TYPE, ($byte: ArrayBuffer) => {
	        //         var byte: ByteArray = new ByteArray($byte);
	        //         combineParticle.setDataByte(byte)
	        //     });
	        // } 
	        combineParticle.url = url;
	        return combineParticle;
	    }
	    registerUrl($url) {
	        $url = $url.replace("_byte.txt", ".txt");
	        $url = $url.replace(".txt", "_byte.txt");
	        if (this._dic[$url]) {
	            var baseData = this._dic[$url];
	            baseData.useNum++;
	        }
	    }
	    releaseUrl($url) {
	        $url = $url.replace("_byte.txt", ".txt");
	        $url = $url.replace(".txt", "_byte.txt");
	        if (this._dic[$url]) {
	            var baseData = this._dic[$url];
	            baseData.clearUseNum();
	        }
	    }
	    addResByte($url, $data) {
	        if (!this._dic[$url]) {
	            var baseData = new CombineParticleData();
	            ////console.log("load particle",$url);
	            baseData.setDataByte($data);
	            this._dic[$url] = baseData;
	        }
	    }
	    update() {
	        // for (var i: number = 0; i < this._particleList.length; i++) {
	        //     this._particleList[i].update();
	        // }
	        this.updateRenderDic();
	        // this.clearPaticleVa();
	    }
	    /*     public clearPaticleVa(): void {
	            Scene_data.context3D.clearVa(2);
	            Scene_data.context3D.clearVa(3);
	            Scene_data.context3D.clearVa(4);
	            Scene_data.context3D.clearVa(5);
	        } */
	    setHide() {
	        for (var i = 0; i < this._particleList.length; i++) {
	            if (!this._particleList[i].dynamic) ;
	        }
	    }
	    get particleList() {
	        return this._particleList;
	    }
	    updateTime() {
	        var _tempTime = TimeUtil.getTimer();
	        var t = _tempTime - this._time;
	        for (var i = 0; i < this._particleList.length; i++) {
	            if (!this._particleList[i].sceneVisible) {
	                continue;
	            }
	            this._particleList[i].updateTime(t);
	        }
	        this._time = _tempTime;
	    }
	    addRenderDic($particle) {
	        var url = $particle.url;
	        if (!this.renderDic[url]) {
	            this.renderDic[url] = new Array;
	        }
	        this.renderDic[url].push($particle);
	    }
	    removeRenderDic($particle) {
	        var url = $particle.url;
	        var indexs = this.renderDic[url].indexOf($particle);
	        if (indexs == -1) {
	            return;
	        }
	        this.renderDic[url].splice(indexs, 1);
	        if (this.renderDic[url].length == 0) {
	            delete this.renderDic[url];
	        }
	    }
	    updateRenderDic() {
	        for (var key in this.renderDic) {
	            var list = this.renderDic[key];
	            if (list.length == 1) {
	                list[0].update();
	            }
	            else {
	                var size = list[0].size;
	                for (var j = 0; j < size; j++) {
	                    for (var i = 0; i < list.length; i++) {
	                        list[i].updateItem(j);
	                    }
	                }
	            }
	        }
	    }
	    addParticle($particle) {
	        if (this._particleList.lastIndexOf($particle) != -1) {
	            return;
	        }
	        this._particleList.push($particle);
	        this.addRenderDic($particle);
	    }
	    removeParticle($particle) {
	        var indexs = this._particleList.indexOf($particle);
	        if (indexs == -1) {
	            return;
	        }
	        this._particleList.splice(indexs, 1);
	        this.removeRenderDic($particle);
	    }
	    gc() {
	        super.gc();
	    }
	}

	class BaseRes extends ResCount {
	    constructor() {
	        super(...arguments);
	        this.allImgBytes = 10000000;
	    }
	    //constructor() {
	    //this.useNum = 0;
	    //}
	    read($imgFun = null) {
	        this._imgFun = $imgFun;
	        var fileType = this._byte.readInt();
	        if (fileType == BaseRes.IMG_TYPE) {
	            if (Scene_data.supportBlob) {
	                this.readImg();
	            }
	            else {
	                this.readImgLow();
	            }
	        }
	        else if (fileType == BaseRes.OBJS_TYPE) {
	            this.readObj(this._byte);
	        }
	        else if (fileType == BaseRes.MATERIAL_TYPE) {
	            this.readMaterial();
	        }
	        else if (fileType == BaseRes.PARTICLE_TYPE) {
	            this.readParticle();
	        }
	        else if (fileType == BaseRes.ZIP_OBJS_TYPE) {
	            this.readZipObj();
	        }
	    }
	    readZipObj() {
	        var zipLen = this._byte.readInt();
	        var aryBuf = this._byte.buffer.slice(this._byte.position, this._byte.position + zipLen);
	        this._byte.position += zipLen;
	        var zipedBuf = Util.unZip(aryBuf);
	        var newByte = new Pan3dByteArray(zipedBuf);
	        this.readObj(newByte);
	    }
	    readImg() {
	        this.imgNum = this._byte.readInt();
	        this.imgLoadNum = 0;
	        for (var i = 0; i < this.imgNum; i++) {
	            var url = Scene_data.fileRoot + this._byte.readUTF();
	            var imgSize = this._byte.readInt();
	            if (url.search(".jpng") != -1) {
	                this.readJpngImg(url);
	                continue;
	            }
	            var imgAryBuffer = this._byte.buffer.slice(this._byte.position, this._byte.position + imgSize);
	            this._byte.position += imgSize;
	            var img = new Image();
	            img.url = url;
	            img.onload = (evt) => {
	                this.loadImg(evt.target);
	                var etimg = evt.target;
	            };
	            var t = url.substr(url.lastIndexOf('.') + 1).toLocaleLowerCase();
	            t = "jpg";
	            console.log(url + "readImg" + 'data:image/' + t + ';base64,');
	            img.src = 'data:image/' + t + ';base64,' + Base64.encode(imgAryBuffer);
	        }
	    }
	    readJpngImg($url) {
	        var rgbSize = this._byte.readInt();
	        var imgAryBuffer = this._byte.buffer.slice(this._byte.position, this._byte.position + rgbSize);
	        this._byte.position += rgbSize;
	        var alphaSize = this._byte.readInt();
	        var alphaImgAryBuffer = this._byte.buffer.slice(this._byte.position, this._byte.position + alphaSize);
	        this._byte.position += alphaSize;
	        var img = new Image();
	        var alphaImg = new Image();
	        var loadNum = 0;
	        var comFun = (evt) => {
	            loadNum++;
	            if (loadNum < 2) {
	                return;
	            }
	            var ctx = UIManager.getInstance().getContext2D(img.width, img.height);
	            ctx.drawImage(img, 0, 0);
	            var imgData = ctx.getImageData(0, 0, img.width, img.height);
	            ctx.clearRect(0, 0, img.width, img.height);
	            ctx.drawImage(alphaImg, 0, 0);
	            var alphaImgdata = ctx.getImageData(0, 0, img.width, img.height);
	            for (var i = 0; i < imgData.data.length; i += 4) {
	                var per = alphaImgdata.data[i] / 255;
	                // imgData.data[i] *= per;
	                // imgData.data[i + 1] *= per;
	                // imgData.data[i + 2] *= per;
	                imgData.data[i + 3] = alphaImgdata.data[i];
	            }
	            this.addImg($url.replace(".jpng", ".png"), imgData);
	        };
	        img.onload = comFun;
	        alphaImg.onload = comFun;
	        img.src = 'data:image/png;base64,' + Base64.encode(imgAryBuffer);
	        alphaImg.src = 'data:image/png;base64,' + Base64.encode(alphaImgAryBuffer);
	    }
	    readImgLow() {
	        this.imgNum = this._byte.readInt();
	        this.imgLoadNum = 0;
	        // this.imgAry = new Array;
	        var time = TimeUtil.getTimer();
	        var bytes = 0;
	        for (var i = 0; i < this.imgNum; i++) {
	            var url = Scene_data.fileRoot + this._byte.readUTF();
	            var imgSize = this._byte.readInt();
	            bytes += imgSize;
	            var img = new Image();
	            img.url = url;
	            //this.imgAry.push(url);
	            img.onload = (evt) => {
	                this.loadImg(evt.target);
	            };
	            img.src = url;
	        }
	        this.allImgBytes = bytes;
	    }
	    loadImg(img) {
	        TextureManager.getInstance().addRes(img.url, img);
	        this.countImg();
	    }
	    addImg($url, img) {
	        TextureManager.getInstance().addRes($url, img);
	        this.countImg();
	    }
	    countImg() {
	        this.imgLoadNum++;
	        if (this.imgLoadNum == this.imgNum) {
	            this._imgComplete = true;
	            this.allResCom();
	        }
	    }
	    readObj($srcByte) {
	        var objNum = $srcByte.readInt();
	        for (var i = 0; i < objNum; i++) {
	            var url = Scene_data.fileRoot + $srcByte.readUTF();
	            var size = $srcByte.readInt();
	            var newByte = new Pan3dByteArray();
	            newByte.length = size;
	            $srcByte.readBytes(newByte, 0, size);
	            var objData = ObjDataManager.getInstance().loadObjCom(newByte.buffer, url);
	        }
	        if (this._imgFun) {
	            this._imgFun();
	        }
	    }
	    readMaterial() {
	        var objNum = this._byte.readInt();
	        //this.materialAry = new Array;
	        var time = TimeUtil.getTimer();
	        for (var i = 0; i < objNum; i++) {
	            var url = Scene_data.fileRoot + this._byte.readUTF();
	            var size = this._byte.readInt();
	            var dataByte = new Pan3dByteArray;
	            dataByte.length = size;
	            this._byte.readBytes(dataByte, 0, size);
	            MaterialManager.getInstance().addResByte(url, dataByte);
	            //this.materialAry.push(url);
	        }
	        ////console.log("material time", (TimeUtil.getTimer() - time));
	        //this.read();
	    }
	    readParticle() {
	        var objNum = this._byte.readInt();
	        //this.particleAry = new Array;
	        var time = TimeUtil.getTimer();
	        for (var i = 0; i < objNum; i++) {
	            var url = Scene_data.fileRoot + this._byte.readUTF();
	            var size = this._byte.readInt();
	            var dataByte = new Pan3dByteArray;
	            dataByte.length = size;
	            this._byte.readBytes(dataByte, 0, size);
	            ParticleManager.getInstance().addResByte(url, dataByte);
	            //this.particleAry.push(url);
	            //SceneRes.particleDic[url] = str;
	        }
	        ////console.log("particle time", (TimeUtil.getTimer() - time));
	        //this.read();
	    }
	    //读材质参数
	    readMaterialInfo() {
	        var len = this._byte.readInt();
	        if (len > 0) {
	            var $arr = new Array;
	            for (var i = 0; i < len; i++) {
	                var $temp = new Object();
	                $temp.type = this._byte.readInt();
	                $temp.name = this._byte.readUTF();
	                if ($temp.type == 0) {
	                    $temp.url = this._byte.readUTF();
	                }
	                if ($temp.type == 1) {
	                    $temp.x = this._byte.readFloat();
	                }
	                if ($temp.type == 2) {
	                    $temp.x = this._byte.readFloat();
	                    $temp.y = this._byte.readFloat();
	                }
	                if ($temp.type == 3) {
	                    $temp.x = this._byte.readFloat();
	                    $temp.y = this._byte.readFloat();
	                    $temp.z = this._byte.readFloat();
	                }
	                $arr.push($temp);
	            }
	            return $arr;
	        }
	        else {
	            return null;
	        }
	    }
	    //读取浮点数据，两个字节
	    static readFloatTwoByte(byte, vertices) {
	        var verLength = byte.readInt();
	        if (verLength > 0) {
	            var $scaleNum = byte.readFloat();
	            vertices.length = 0;
	            for (var i = 0; i < verLength; i++) {
	                vertices.push(byte.readFloatTwoByte($scaleNum));
	            }
	        }
	    }
	    //读取一个字节的LightMap
	    static readFloatOneByte(byte, vertices) {
	        var verLength = byte.readInt();
	        if (verLength > 0) {
	            for (var i = 0; i < verLength; i++) {
	                vertices.push((byte.readByte() + 128) / 256);
	            }
	        }
	    }
	    static readIntForTwoByte(byte, indexs) {
	        var iLen = byte.readInt();
	        for (var i = 0; i < iLen; i++) {
	            indexs.push(byte.readShort());
	        }
	    }
	    static readIntForOneByte(byte, indexs) {
	        var iLen = byte.readInt();
	        for (var i = 0; i < iLen; i++) {
	            indexs.push(byte.readByte());
	        }
	    }
	    /**
	     * $readType
	     * 0 readFloatTwoByte
	     * 1 readFloatOneByte
	     * 2 readIntForOneByte
	     *  */
	    static readBytes2ArrayBuffer($byte, $data, $dataWidth, $offset, $stride, $readType = 0) {
	        var verLength = $byte.readInt();
	        if (verLength <= 0) {
	            return;
	        }
	        var scaleNum;
	        if ($readType == 0) {
	            scaleNum = $byte.readFloat();
	        }
	        var readNum = verLength / $dataWidth;
	        var getValue;
	        for (var i = 0; i < readNum; i++) {
	            var pos = $stride * i + $offset;
	            for (var j = 0; j < $dataWidth; j++) {
	                if ($readType == 0) {
	                    getValue = $byte.readFloatTwoByte(scaleNum);
	                }
	                else if ($readType == 1) {
	                    getValue = $byte.readFloatOneByte();
	                }
	                else if ($readType == 2) {
	                    getValue = $byte.readByte();
	                }
	                else if ($readType == 3) {
	                    getValue = ($byte.readByte() + 128) / 255;
	                }
	                else if ($readType == 4) {
	                    getValue = $byte.readFloat();
	                }
	                if ($data) {
	                    $data.setFloat32((pos + j) * 4, getValue, true);
	                }
	            }
	        }
	    }
	    //读取材质参数
	    static readMaterialParamData(byte) {
	        var mpNum = byte.readInt();
	        if (mpNum > 0) {
	            var mpAry = new Array;
	            for (var j = 0; j < mpNum; j++) {
	                var obj = new Object;
	                obj.name = byte.readUTF();
	                obj.type = byte.readByte();
	                if (obj.type == 0) {
	                    obj.url = byte.readUTF();
	                }
	                else if (obj.type == 1) {
	                    obj.x = byte.readFloat();
	                }
	                else if (obj.type == 2) {
	                    obj.x = byte.readFloat();
	                    obj.y = byte.readFloat();
	                }
	                else if (obj.type == 3) {
	                    obj.x = byte.readFloat();
	                    obj.y = byte.readFloat();
	                    obj.z = byte.readFloat();
	                }
	                mpAry.push(obj);
	            }
	            return mpAry;
	        }
	        return null;
	    }
	    allResCom() {
	        if (this._imgFun) {
	            this._imgFun();
	        }
	    }
	    static readIntForTwoByteNew(byte) {
	        var iLen = byte.readInt();
	        var indices = new Uint16Array(iLen);
	        for (var i = 0; i < iLen; i++) {
	            indices[i] = byte.readShort();
	        }
	        return indices;
	    }
	    /**
	     * 读取int型索引
	     * @param byte
	     */
	    static readIndexForInt(byte) {
	        var iLen = byte.readInt();
	        var indices = new Uint16Array(iLen);
	        for (var i = 0; i < iLen; i++) {
	            indices[i] = byte.readInt();
	        }
	        return indices;
	    }
	}
	BaseRes.IMG_TYPE = 1;
	BaseRes.OBJS_TYPE = 2;
	BaseRes.MATERIAL_TYPE = 3;
	BaseRes.PARTICLE_TYPE = 4;
	BaseRes.SCENE_TYPE = 5;
	BaseRes.ZIP_OBJS_TYPE = 6;
	BaseRes.PREFAB_TYPE = 1;
	BaseRes.SCENE_PARTICLE_TYPE = 11;

	class CollisionVo extends Object3D {
	    constructor($x = 0, $y = 0, $z = 0) {
	        super();
	    }
	}
	class CollisionItemVo {
	}

	class ObjDataManager extends ResGC {
	    constructor() {
	        //this._dic = new Object();
	        super();
	        this._loadList = new Object();
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new ObjDataManager();
	        }
	        return this._instance;
	    }
	    getObjData($url, $fun) {
	        if (this._dic[$url]) {
	            $fun(this._dic[$url]);
	            this._dic[$url].useNum++;
	            return;
	        }
	        var ary;
	        if (!this._loadList[$url]) {
	            this._loadList[$url] = new Array;
	            LoadManager.getInstance().load($url, LoadManager.BYTE_TYPE, ($byte) => {
	                this.loadObjCom($byte, $url);
	            });
	        }
	        ary = this._loadList[$url];
	        ary.push($fun);
	    }
	    registerUrl($url) {
	        if (this._dic[$url]) {
	            this._dic[$url].useNum++;
	        }
	    }
	    releaseUrl($url) {
	        if (this._dic[$url]) {
	            this._dic[$url].clearUseNum();
	        }
	    }
	    gc() {
	        super.gc();
	    }
	    readFloatNrm(byte, vertices) {
	        var verLength = byte.readInt();
	        if (verLength > 0) {
	            for (var i = 0; i < verLength; i++) {
	                vertices.push(byte.readFloat());
	            }
	        }
	    }
	    readcollisionItem(byte, $objData) {
	        //将碰撞体都写入对象的OBJ对象中
	        var $len = byte.readInt();
	        if ($len > 0) {
	            $objData.collision = new CollisionItemVo();
	            $objData.collision.collisionItem = new Array;
	            for (var i = 0; i < $len; i++) {
	                var $xmlcollisionVo = JSON.parse(byte.readUTF());
	                var $collisionVo = new CollisionVo();
	                $collisionVo.scaleX = $xmlcollisionVo.scale_x;
	                $collisionVo.scaleY = $xmlcollisionVo.scale_y;
	                $collisionVo.scaleZ = $xmlcollisionVo.scale_z;
	                $collisionVo.x = $xmlcollisionVo.x;
	                $collisionVo.y = $xmlcollisionVo.y;
	                $collisionVo.z = $xmlcollisionVo.z;
	                $collisionVo.rotationX = $xmlcollisionVo.rotationX;
	                $collisionVo.rotationY = $xmlcollisionVo.rotationY;
	                $collisionVo.rotationZ = $xmlcollisionVo.rotationZ;
	                $collisionVo.scaleX = this.getFloadNum($collisionVo.scaleX);
	                $collisionVo.scaleY = this.getFloadNum($collisionVo.scaleY);
	                $collisionVo.scaleZ = this.getFloadNum($collisionVo.scaleZ);
	                $collisionVo.rotationX = this.getFloadNum($collisionVo.rotationX);
	                $collisionVo.rotationY = this.getFloadNum($collisionVo.rotationY);
	                $collisionVo.rotationZ = this.getFloadNum($collisionVo.rotationZ);
	                $collisionVo.type = $xmlcollisionVo.type;
	                $collisionVo.data = $xmlcollisionVo.data;
	                $objData.collision.collisionItem.push($collisionVo);
	            }
	        }
	    }
	    getFloadNum(value) {
	        return Math.floor(value * 1000) / 1000;
	    }
	    loadObjCom($byte, $url) {
	        if (this._dic[$url]) {
	            return;
	        }
	        ////console.log($objData);
	        var $objData = new ObjData();
	        var byte = new Pan3dByteArray($byte);
	        var version = byte.readInt();
	        var str = byte.readUTF();
	        if (version >= 20) {
	            this.readObj2OneBuffer(byte, $objData);
	            if (version >= 37 && byte.position < byte.length) { //加上碰撞体
	                this.readcollisionItem(byte, $objData);
	            }
	        }
	        else {
	            BaseRes.readFloatTwoByte(byte, $objData.vertices);
	            BaseRes.readFloatTwoByte(byte, $objData.uvs);
	            BaseRes.readFloatOneByte(byte, $objData.lightuvs);
	            BaseRes.readFloatTwoByte(byte, $objData.normals);
	            BaseRes.readIntForTwoByte(byte, $objData.indexs);
	            BaseRes.readFloatTwoByte(byte, $objData.tangents);
	            BaseRes.readFloatTwoByte(byte, $objData.bitangents);
	            $objData.vertexBuffer = Scene_data.context3D.uploadBuff3D($objData.vertices);
	            $objData.uvBuffer = Scene_data.context3D.uploadBuff3D($objData.uvs);
	            $objData.lightUvBuffer = Scene_data.context3D.uploadBuff3D($objData.lightuvs);
	            $objData.normalsBuffer = Scene_data.context3D.uploadBuff3D($objData.normals);
	        }
	        $objData.treNum = $objData.layaIndexBuffer.indexCount;
	        $objData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D($objData.indexs);
	        this._dic[$url] = $objData;
	        var ary = this._loadList[$url];
	        if (ary) {
	            for (var i = 0; i < ary.length; i++) {
	                ary[i]($objData);
	            }
	            delete this._loadList[$url];
	        }
	        return $objData;
	    }
	    readObj2OneBuffer(byte, $objData) {
	        var typeItem = new Array;
	        var len;
	        var typeItem = new Array;
	        var dataWidth = 0;
	        for (var i = 0; i < 6; i++) {
	            var tf = byte.readBoolean();
	            typeItem.push(tf);
	            if (tf) {
	                switch (i) {
	                    case 1: //uv
	                        dataWidth += 2;
	                        break;
	                    case 2: //lightuv
	                        dataWidth += 2;
	                        break;
	                    default:
	                        dataWidth += 3;
	                        break;
	                }
	            }
	        }
	        len = byte.readFloat();
	        //数据不好对应，先暂时补齐
	        let vertexFlag = "POSITION,UV";
	        let vertexDeclaration = VertexMesh.getVertexDeclaration(vertexFlag, true);
	        let stride = vertexDeclaration.vertexStride;
	        len *= stride;
	        dataWidth = stride / 4;
	        var arybuff = new ArrayBuffer(len);
	        var data = new DataView(arybuff);
	        var uvsOffsets = 3;
	        var lightuvsOffsets = uvsOffsets + 2;
	        var normalsOffsets = typeItem[2] ? (lightuvsOffsets + 2) : (uvsOffsets + 2);
	        var tangentsOffsets = normalsOffsets + 3;
	        var bitangentsOffsets = tangentsOffsets + 3;
	        BaseRes.readBytes2ArrayBuffer(byte, data, 3, 0, dataWidth); //vertices
	        BaseRes.readBytes2ArrayBuffer(byte, data, 2, uvsOffsets, dataWidth); //uvs
	        BaseRes.readBytes2ArrayBuffer(byte, null, 2, lightuvsOffsets, dataWidth, 1); //lightuvs
	        BaseRes.readBytes2ArrayBuffer(byte, null, 3, normalsOffsets, dataWidth); //normals
	        BaseRes.readBytes2ArrayBuffer(byte, null, 3, tangentsOffsets, dataWidth); //tangents
	        BaseRes.readBytes2ArrayBuffer(byte, null, 3, bitangentsOffsets, dataWidth); //bitangents
	        // BaseRes.readFloatTwoByte(byte, $objData.vertices);
	        // BaseRes.readFloatTwoByte(byte, $objData.uvs);
	        // BaseRes.readLightUvForByte(byte, $objData.lightuvs);
	        // BaseRes.readFloatTwoByte(byte, $objData.normals);
	        // BaseRes.readFloatTwoByte(byte, $objData.tangents);
	        // BaseRes.readFloatTwoByte(byte, $objData.bitangents);
	        // BaseRes.readIntForTwoByte(byte, $objData.indexs);
	        let indices = BaseRes.readIntForTwoByteNew(byte);
	        // var dataAry: Array<number> = new Array;
	        // for (var i: number = 0; i < baseLenght; i++) {
	        //     dataAry.push($objData.vertices[i * 3]);
	        //     dataAry.push($objData.vertices[i * 3 + 1]);
	        //     dataAry.push($objData.vertices[i * 3 + 2]);
	        //     dataAry.push($objData.uvs[i * 2]);
	        //     dataAry.push($objData.uvs[i * 2 + 1]);
	        //     dataAry.push($objData.lightuvs[i * 2]);
	        //     dataAry.push($objData.lightuvs[i * 2 + 1]);
	        // }
	        ////console.log(dataAry);
	        // $objData.vertexBuffer = Scene_data.context3D.uploadBuff3D($objData.vertices);
	        // $objData.uvBuffer = Scene_data.context3D.uploadBuff3D($objData.uvs);
	        // $objData.lightUvBuffer = Scene_data.context3D.uploadBuff3D($objData.lightuvs);
	        // $objData.normalsBuffer = Scene_data.context3D.uploadBuff3D($objData.normals);
	        // $objData.vertexBuffer = Scene_data.context3D.uploadBuff3DArrayBuffer(arybuff);
	        $objData.compressBuffer = true;
	        $objData.uvsOffsets = uvsOffsets * 4;
	        $objData.lightuvsOffsets = lightuvsOffsets * 4;
	        $objData.normalsOffsets = normalsOffsets * 4;
	        $objData.tangentsOffsets = tangentsOffsets * 4;
	        $objData.bitangentsOffsets = bitangentsOffsets * 4;
	        $objData.stride = dataWidth * 4;
	        let vertexBuffer = new VertexBuffer3D(arybuff.byteLength, WebGLRenderingContext.STATIC_DRAW, true);
	        vertexBuffer.vertexDeclaration = vertexDeclaration;
	        vertexBuffer.setData(arybuff);
	        $objData.layaVertexBuffer = vertexBuffer;
	        // meshData.vertexBuffer = Scene_data.context3D.uploadBuff3DArrayBuffer(arybuff);
	        var indexBuffer = new IndexBuffer3D($objData.indexFormat, indices.length, WebGLRenderingContext.STATIC_DRAW, false);
	        indexBuffer.setData(indices);
	        $objData.layaIndexBuffer = indexBuffer;
	        $objData._setBuffer(vertexBuffer, indexBuffer);
	    }
	    creatTBNBuffer($objData) {
	        $objData.tangentBuffer = Scene_data.context3D.uploadBuff3D($objData.tangents);
	        $objData.bitangentBuffer = Scene_data.context3D.uploadBuff3D($objData.bitangents);
	    }
	}

	class MaterialShader extends Shader3D {
	    constructor() {
	        super();
	        this.name = "Material_shader";
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "v2CubeTexST");
	        //if (this.paramAry[0]){
	        //    $context.bindAttribLocation(this.program, 3, "v3Normal");
	        //}
	        //if (this.paramAry[1]){
	        //    $context.bindAttribLocation(this.program, 4, "v3Tangent");
	        //    $context.bindAttribLocation(this.program, 5, "v3Bitangent");
	        //}
	        var usePbr = this.paramAry[0];
	        var useNormal = this.paramAry[1];
	        var lightProbe = this.paramAry[4];
	        var directLight = this.paramAry[5];
	        var noLight = this.paramAry[6];
	        if (!(directLight || noLight)) {
	            $context.bindAttribLocation(this.program, 2, "v2lightuv");
	        }
	        if (usePbr) {
	            $context.bindAttribLocation(this.program, 3, "v3Normal");
	            if (useNormal) {
	                $context.bindAttribLocation(this.program, 4, "v3Tangent");
	                $context.bindAttribLocation(this.program, 5, "v3Bitangent");
	            }
	        }
	        else if (directLight) {
	            $context.bindAttribLocation(this.program, 3, "v3Normal");
	        }
	    }
	    getVertexShaderString() {
	        var usePbr = this.paramAry[0];
	        var useNormal = this.paramAry[1];
	        var hasFresnel = this.paramAry[2];
	        var useDynamicIBL = this.paramAry[3];
	        var lightProbe = this.paramAry[4];
	        var directLight = this.paramAry[5];
	        var noLight = this.paramAry[6];
	        var fogMode = this.paramAry[7];
	        var $str = "attribute vec3 v3Position;\n" +
	            "attribute vec2 v2CubeTexST;\n" +
	            "varying vec2 v0;\n";
	        if (directLight) {
	            $str += "varying vec3 v2;\n";
	        }
	        else if (noLight) ;
	        else {
	            $str +=
	                "attribute vec2 v2lightuv;\n" +
	                    "varying vec2 v2;\n";
	        }
	        if (usePbr) {
	            $str +=
	                "attribute vec3 v3Normal;\n" +
	                    "varying vec3 v1;\n";
	            if (!useNormal) {
	                $str += "varying vec3 v4;\n";
	            }
	            else {
	                $str += "varying mat3 v4;\n";
	            }
	        }
	        else if (fogMode != 0) {
	            $str +=
	                "varying vec3 v1;\n";
	        }
	        if (useNormal) {
	            $str +=
	                "attribute vec3 v3Tangent;\n" +
	                    "attribute vec3 v3Bitangent;\n";
	        }
	        if (directLight) {
	            if (!usePbr) {
	                $str +=
	                    "attribute vec3 v3Normal;\n";
	            }
	            $str +=
	                "uniform vec3 sunDirect;\n" +
	                    "uniform vec3 sunColor;\n" +
	                    "uniform vec3 ambientColor;\n";
	        }
	        $str +=
	            // "uniform mat4 viewMatrix3D;\n" +
	            // "uniform mat4 camMatrix3D;\n" +
	            "uniform mat4 vpMatrix3D;\n" +
	                "uniform mat4 posMatrix3D;\n" +
	                "uniform mat3 rotationMatrix3D;\n";
	        $str +=
	            "void main(void){\n" +
	                "v0 = vec2(v2CubeTexST.x, v2CubeTexST.y);\n" +
	                "vec4 vt0= vec4(v3Position, 1.0);\n" +
	                "vt0 = posMatrix3D * vt0;\n";
	        if (!(directLight || noLight)) {
	            $str += "v2 = vec2(v2lightuv.x, v2lightuv.y);\n";
	        }
	        if (usePbr || fogMode != 0) {
	            $str +=
	                "v1 = vec3(vt0.x,vt0.y,vt0.z);\n";
	        }
	        $str +=
	            //"vt0 = camMatrix3D * vt0;\n" +
	            "vt0 = vpMatrix3D * vt0;\n";
	        if (usePbr) {
	            if (!useNormal) {
	                $str += "v4 = rotationMatrix3D * v3Normal;\n";
	            }
	            else {
	                $str +=
	                    "v4 = mat3(rotationMatrix3D * v3Tangent,rotationMatrix3D * v3Bitangent, rotationMatrix3D * v3Normal);\n";
	            }
	        }
	        if (directLight) {
	            if (!usePbr) {
	                $str +=
	                    //    "vec4 n = rotationMatrix3D * vec4(v3Normal, 1.0);\n" +
	                    "vec3 n = rotationMatrix3D * v3Normal;\n" +
	                        "float suncos = dot(n.xyz,sunDirect.xyz);\n";
	            }
	            else {
	                $str +=
	                    "float suncos = dot(v4.xyz,sunDirect.xyz);\n";
	            }
	            $str +=
	                "suncos = clamp(suncos,0.0,1.0);\n" +
	                    "v2 = sunColor * suncos + ambientColor;";
	            //"v2 = vec3(1.0,0.0,0.0);\n";
	        }
	        $str += "gl_Position = vt0;" + "}";
	        //   this.outstr($str);
	        return $str;
	    }
	    outstr(str) {
	        var arr = str.split(";");
	        for (var i = 0; i < arr.length; i++) {
	            var $ddd = String(Util.trim(arr[i]));
	            //console.log("\"" + $ddd + "\;" + "\"" + "\+")
	        }
	        //   //console.log(arr)
	    }
	    getFragmentShaderString() {
	        var $str = 
	        //"#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
	        //"precision highp float;\n" +
	        //" #else\n" +
	        //" precision mediump float;\n" +
	        //" #endif\n" +
	        "uniform sampler2D s_texture1;\n" +
	            //"uniform sampler2D light_texture;\n" +
	            "uniform vec4 testconst;" +
	            "varying vec2 v_texCoord;\n" +
	            //"varying vec2 v_texLight;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(s_texture, v_texCoord.xy);\n" +
	            //"if (infoUv.a <= 0.9) {\n" +
	            //"     discard;\n" +
	            //"}\n" +
	            //"vec4 infoLight = texture2D(light_texture, v_texLight);\n" +
	            //"vec4 test = vec4(0.5,0,0,1);\n" +
	            "infoUv.xyz = testconst.xyz * infoUv.xyz;\n" +
	            //"info.rgb = info.rgb / 0.15;\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	MaterialShader.MATERIAL_SHADER = "Material_shader";

	class Display3DSprite extends Display3D {
	    constructor() {
	        super();
	        this.time = 0;
	        this.dynamic = false;
	        this._rotationMatrix = new Matrix3D;
	        //this.lightMapTexture = TextureManager.getInstance().defaultLightMap;
	    }
	    get aabbVect() {
	        if (!this._aabbVect) {
	            var $aabb = this.aabb;
	            var ax = $aabb.x;
	            var ay = $aabb.y;
	            var az = $aabb.z;
	            var bx = $aabb.width;
	            var by = $aabb.height;
	            var bz = $aabb.depth;
	            this._aabbVect = new Array;
	            this._aabbVect.push(new Vector3D(ax, ay, az));
	            this._aabbVect.push(new Vector3D(ax + bx, ay, az));
	            this._aabbVect.push(new Vector3D(ax, ay + by, az));
	            this._aabbVect.push(new Vector3D(ax, ay, az + bz));
	            this._aabbVect.push(new Vector3D(ax + bx, ay + by, az));
	            this._aabbVect.push(new Vector3D(ax + bx, ay, az + bz));
	            this._aabbVect.push(new Vector3D(ax, ay + by, az + bz));
	            this._aabbVect.push(new Vector3D(ax + bx, ay + by, az + bz));
	        }
	        return this._aabbVect;
	    }
	    setObjUrl(value) {
	        this.objurl = value;
	        ObjDataManager.getInstance().getObjData(Scene_data.fileRoot + value, ($obj) => {
	            this.objData = $obj;
	            if (this.material) {
	                if (!this.objData.tangentBuffer) {
	                    ObjDataManager.getInstance().creatTBNBuffer(this.objData);
	                }
	            }
	        });
	    }
	    setPicUrl($str) {
	        this.picUrl = $str;
	        TextureManager.getInstance().getTexture(Scene_data.fileRoot + $str, ($texture) => {
	            this.baseTexture = $texture;
	        });
	    }
	    setLightMapUrl(value) {
	        if (!value || value == "") {
	            return;
	        }
	        var url = Scene_data.fileRoot + value;
	        TextureManager.getInstance().getTexture(url, ($texture) => {
	            //this.lightMapTexture = $texture;
	            this.lightMapTextureRes = $texture;
	        });
	    }
	    get lightMapTexture() {
	        if (!this.lightMapTextureRes) ;
	        return this.lightMapTextureRes.texture;
	    }
	    setMaterialUrl(value, $paramData = null) {
	        value = value.replace("_byte.txt", ".txt");
	        value = value.replace(".txt", "_byte.txt");
	        this.materialUrl = Scene_data.fileRoot + value;
	        //var materialshader: MaterialShader = new MaterialShader;
	        MaterialManager.getInstance().getMaterialByte(this.materialUrl, ($material) => {
	            this.material = $material;
	            if (this.material.useNormal) {
	                if (this.objData && !this.objData.tangentBuffer) {
	                    ObjDataManager.getInstance().creatTBNBuffer(this.objData);
	                }
	            }
	            if (this.material.usePbr || this.material.directLight) {
	                this._rotationData = new Float32Array(9);
	                this.updateRotationMatrix();
	            }
	            if ($paramData) {
	                this.materialParam = new MaterialBaseParam();
	                this.materialParam.setData(this.material, $paramData);
	            }
	        }, null, true, MaterialShader.MATERIAL_SHADER, MaterialShader);
	    }
	    get lightProbe() {
	        return this._lightProbe;
	    }
	    set lightProbe(value) {
	        this._lightProbe = value;
	        if (this._lightProbe) {
	            if (!this.resultSHVec) {
	                this.resultSHVec = new Array;
	                var ary = [0.4444730390920146, -0.3834955622240026, -0.33124467509627725, 0.09365654209093091,
	                    -0.05673310882817577, 0.2120523322966496, 0.02945768486978205, -0.04965996229802928, -0.1136529129285836];
	                for (var i = 0; i < 9; i++) {
	                    this.resultSHVec.push(new Vector3D(ary[i], ary[i], ary[i]));
	                }
	            }
	        }
	    }
	    update() {
	        if (this.dynamic) {
	            if (!this.sceneVisible) {
	                return;
	            }
	        }
	        this.updateMaterial();
	        // return;
	        // Scene_data.context3D.setProgram(this.program);
	        // Scene_data.context3D.setVcMatrix4fv(this.program, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	        // Scene_data.context3D.setVcMatrix4fv(this.program, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        // Scene_data.context3D.setVcMatrix4fv(this.program, "posMatrix3D", this.posMatrix.m);
	        // var mk = [0, 0, 0, 0];
	        // Scene_data.context3D.setVc4fv(this.program, "testconst", mk);
	        // var mk2 = [1.5, 0, 0, 0];
	        // Scene_data.context3D.setVc4fv(this.program, "testconst2", mk2);
	        // //if (this.baseTexture) {
	        // //    Scene_data.context3D.setRenderTexture(this.program, "s_texture", this.baseTexture,0);
	        // //}
	        // Scene_data.context3D.setVa(0, 3, this.objData.vertexBuffer);
	        // Scene_data.context3D.setVa(1, 2, this.objData.uvBuffer);
	        // Scene_data.context3D.drawCall(this.objData.indexBuffer, this.objData.treNum);
	    }
	    updateMaterial() {
	        if (!this.material || !this.objData) {
	            return;
	        }
	        Scene_data.context3D.setBlendParticleFactors(this.material.blendMode);
	        Scene_data.context3D.cullFaceBack(this.material.backCull);
	        this.updateBind();
	        ////console.log(this.material.url);
	        Scene_data.context3D.setProgram(this.material.program);
	        Scene_data.context3D.setWriteDepth(this.material.writeZbuffer);
	        Scene_data.context3D.setVcMatrix4fv(this.material.shader, "posMatrix3D", this.posMatrix.m);
	        this.setCam();
	        //this.setBaseMaterialVc(this.material);
	        this.setMaterialVc(this.material, this.materialParam);
	        this.setMaterialTexture(this.material, this.materialParam);
	        this.setDirectLight(this.material);
	        this.setMaterialVa();
	        // Scene_data.context3D.drawCall(this.objData.indexBuffer, this.objData.treNum);
	        Scene_data.context3D.drawCallL3d(this.objData.treNum);
	        this.objData._bufferState.unBind();
	    }
	    renderShadow() {
	        if (this.bindTarget && this.bindTarget.getIsShadow()) {
	            let oldProgram = this.material.program;
	            let oldShader = this.material.shader;
	            this.material.shader = PlanarShadowShader.getInst();
	            this.material.program = PlanarShadowShader.getInst().program;
	            ////console.log(this.material.url);
	            Scene_data.context3D.setProgram(this.material.program);
	            //this.setCam();
	            //Scene_data.context3D.setVcMatrix4fv(this.material.shader, "posMatrix3D", this.posMatrix.m);
	            Scene_data.context3D.setVcMatrix4fv(this.material.shader, "uMProjCameraMatrix", new Float32Array(Scene_data.vpMatrix.m));
	            this.updateBind();
	            Scene_data.context3D.setVcMatrix4fv(this.material.shader, "uMMatrix", this.posMatrix.m);
	            Scene_data.context3D.setVc3fv(this.material.shader, "uLightLocation", PlanarShadowShader.getLightPosArry(this.posMatrix));
	            this.setMaterialVa();
	            // Scene_data.context3D.drawCall(this.objData.indexBuffer, this.objData.treNum);
	            Scene_data.context3D.drawCallL3d(this.objData.treNum);
	            this.objData._bufferState.unBind();
	            this.material.shader = oldShader;
	            this.material.program = oldProgram;
	        }
	    }
	    setMaterialVa() {
	        if (this.objData.compressBuffer) {
	            this.setMaterialVaCompress();
	        }
	        else {
	            this.setMaterialVaIndependent();
	        }
	    }
	    setMaterialVaIndependent() {
	        Scene_data.context3D.setVa(0, 3, this.objData.vertexBuffer);
	        Scene_data.context3D.setVa(1, 2, this.objData.uvBuffer);
	        if (!(this.material.directLight || this.material.noLight)) {
	            Scene_data.context3D.setVa(2, 2, this.objData.lightUvBuffer);
	        }
	        if (this.material.usePbr || this.material.directLight) {
	            Scene_data.context3D.setVa(3, 3, this.objData.normalsBuffer);
	            Scene_data.context3D.setVcMatrix3fv(this.material.shader, "rotationMatrix3D", this._rotationData);
	        }
	        if (this.material.useNormal) {
	            Scene_data.context3D.setVa(4, 3, this.objData.tangentBuffer);
	            Scene_data.context3D.setVa(5, 3, this.objData.bitangentBuffer);
	        }
	    }
	    setMaterialVaCompress() {
	        /*         var tf: boolean = Scene_data.context3D.pushVa(this.objData.vertexBuffer);
	                if (tf) {
	                    return;
	                }
	        
	                Scene_data.context3D.setVaOffset(0, 3, this.objData.stride, 0);
	                Scene_data.context3D.setVaOffset(1, 2, this.objData.stride, this.objData.uvsOffsets);
	                if (!(this.material.directLight || this.material.noLight)) {
	                    Scene_data.context3D.setVaOffset(2, 2, this.objData.stride, this.objData.lightuvsOffsets);
	                }
	        
	                if (this.material.usePbr || this.material.directLight) {
	                    Scene_data.context3D.setVaOffset(3, 3, this.objData.stride, this.objData.normalsOffsets);
	                    Scene_data.context3D.setVcMatrix3fv(this.material.shader, "rotationMatrix3D", this._rotationData);
	                }
	                if (this.material.useNormal) {
	                    Scene_data.context3D.setVaOffset(4, 3, this.objData.stride, this.objData.tangentsOffsets);
	                    Scene_data.context3D.setVaOffset(5, 3, this.objData.stride, this.objData.bitangentsOffsets);
	                } */
	        this.objData._bufferState.bind();
	    }
	    setDirectLight($material) {
	        if ($material.directLight) {
	            Scene_data.context3D.setVc3fv($material.shader, "ambientColor", Scene_data.light.ambientColor);
	            Scene_data.context3D.setVc3fv($material.shader, "sunDirect", Scene_data.light.sunDirect);
	            Scene_data.context3D.setVc3fv($material.shader, "sunColor", Scene_data.light.sunColor);
	        }
	    }
	    setCam() {
	        // var mvc:Float32Array = new Float32Array(16 * 3);
	        // mvc.set(this.posMatrix.m,0);
	        // mvc.set(Scene_data.viewMatrx3D.m,16);
	        // mvc.set(Scene_data.cam3D.cameraMatrix.m,32);
	        //Scene_data.context3D.setVcMatrix4fv(this.material.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	        //Scene_data.context3D.setVcMatrix4fv(this.material.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        //var m:Matrix3D = new Matrix3D;
	        //m.prepend(Scene_data.viewMatrx3D);
	        // m.prepend(Scene_data.cam3D.cameraMatrix);
	        //Scene_data.context3D.setVcMatrix4fv(this.material.shader, "vpMatrix3D", Scene_data.vpMatrix.m);
	        Scene_data.context3D.setVpMatrix(this.material.shader, Scene_data.vpMatrix.m);
	    }
	    setBind($bindTarget, $bindSocket) {
	        this.bindTarget = $bindTarget;
	        this.bindSocket = $bindSocket;
	        this.bindMatrix = new Matrix3D();
	    }
	    setGroup($pos, $rotaion, $scale) {
	        this._isInGroup = true;
	        this._groupPos = $pos;
	        this._groupRotation = $rotaion;
	        this._groupScale = $scale;
	        this.groupMatrix = new Matrix3D();
	        this.groupRotationMatrix = new Matrix3D();
	        this.groupMatrix.isIdentity = false;
	        this.groupMatrix.identity();
	        this.groupMatrix.appendScale($scale.x, $scale.y, $scale.z);
	        this.groupMatrix.appendRotation($rotaion.x, Vector3D.X_AXIS);
	        this.groupMatrix.appendRotation($rotaion.y, Vector3D.Y_AXIS);
	        this.groupMatrix.appendRotation($rotaion.z, Vector3D.Z_AXIS);
	        this.groupMatrix.appendTranslation($pos.x, $pos.y, $pos.z);
	        this.groupRotationMatrix.isIdentity = false;
	        this.groupRotationMatrix.identity();
	        this.groupRotationMatrix.prependRotation($rotaion.z, Vector3D.Z_AXIS);
	        this.groupRotationMatrix.prependRotation($rotaion.y, Vector3D.Y_AXIS);
	        this.groupRotationMatrix.prependRotation($rotaion.x, Vector3D.X_AXIS);
	    }
	    updateBind() {
	        if (this.bindTarget) {
	            this.posMatrix.identity();
	            this.posMatrix.appendScale(this._scaleX * SceneManager.scaleWorld.x, this._scaleY * SceneManager.scaleWorld.y, this._scaleZ * SceneManager.scaleWorld.z);
	            if (this._isInGroup) {
	                this.posMatrix.append(this.groupMatrix);
	                //posMatrix.prependTranslation(groupPos.x, groupPos.y, groupPos.z);
	                //posMatrix.prependRotation(groupRotation.z, Vector3D.Z_AXIS);
	                //posMatrix.prependRotation(groupRotation.y, Vector3D.Y_AXIS);
	                //posMatrix.prependRotation(groupRotation.x, Vector3D.X_AXIS);
	                //posMatrix.prependScale(groupScale.x, groupScale.y, groupScale.z);
	            }
	            this.bindTarget.getSocket(this.bindSocket, this.bindMatrix);
	            this._x = this.bindMatrix.x;
	            this._y = this.bindMatrix.y;
	            this._z = this.bindMatrix.z;
	            this.bindMatrix.identityPostion();
	            this.posMatrix.append(this.bindMatrix);
	            this.posMatrix.appendTranslation(this._x * SceneManager.scaleWorld.x, this._y * SceneManager.scaleWorld.y, this._z * SceneManager.scaleWorld.z);
	            this.bindMatrix.copyTo(this._rotationMatrix);
	            this._rotationMatrix.identityPostion();
	            if (this._isInGroup) {
	                this._rotationMatrix.prepend(this.groupRotationMatrix);
	                //_rotationMatrix.prependRotation(groupRotation.z, Vector3D.Z_AXIS);
	                //_rotationMatrix.prependRotation(groupRotation.y, Vector3D.Y_AXIS);
	                //_rotationMatrix.prependRotation(groupRotation.x, Vector3D.X_AXIS);
	            }
	            this.sceneVisible = this.bindTarget.visible;
	        }
	    }
	    setBaseMaterialVc($material) {
	        var t = 0;
	        if ($material.hasTime) {
	            t = (TimeUtil.getTimer() - this.time) % 100000 * 0.001;
	        }
	        if ($material.hasTime || $material.usePbr || $material.useKill) {
	            Scene_data.context3D.setVc4fv($material.shader, "fc0", [1, 0, $material.killNum, t]); //sceneEvnScale,null,killNum,time;
	        }
	        if ($material.scaleLightMap) {
	            Scene_data.context3D.setVcFloat($material.shader, "scalelight", Scene_data.scaleLight);
	        }
	        if ($material.usePbr || $material.fogMode == 1) {
	            this.setCamPos($material);
	        }
	        if ($material.fogMode != 0) {
	            Scene_data.context3D.setVc2fv($material.shader, "fogdata", Scene_data.fogData);
	            Scene_data.context3D.setVc3fv($material.shader, "fogcolor", Scene_data.fogColor);
	        }
	    }
	    setCamPos($material) {
	        // var p: Vector3D = new Vector3D(Scene_data.cam3D.x, Scene_data.cam3D.y, Scene_data.cam3D.z, 1.0);
	        // p.scaleBy(1/100)
	        // Scene_data.context3D.setVc4fv($material.shader, "fc2", [p.x,p.y,p.z,p.w]);
	        $material.updateCam(Scene_data.cam3D.x / 100, Scene_data.cam3D.y / 100, Scene_data.cam3D.z / 100);
	    }
	    setMaterialVc($material, $mp = null) {
	        if ($material.fcNum <= 0) {
	            return;
	        }
	        var t = 0;
	        if ($material.hasTime) {
	            t = (TimeUtil.getTimer() - this.time) % 100000 * 0.001;
	        }
	        $material.update(t);
	        this.setCamPos($material);
	        if ($mp) {
	            $mp.update();
	        }
	        Scene_data.context3D.setVc4fv($material.shader, "fc", $material.fcData);
	        ////console.log($material.fcData);
	        // var constVec:Array<ConstItem> = $material.constList;
	        // for(var i:number=0;i<constVec.length;i++){
	        //     Scene_data.context3D.setVc4fv($material.shader, constVec[i].name, constVec[i].vecNum);
	        // }
	    }
	    setMaterialTexture($material, $mp = null) {
	        var texVec = $material.texList;
	        if (!texVec) { //todo：check
	            return;
	        }
	        for (var i = 0; i < texVec.length; i++) {
	            if (texVec[i].type == TexItem.LIGHTMAP) {
	                //_context.setTextureAt(texVec[i].id, lightMapTexture);
	                Scene_data.context3D.setRenderTexture($material.shader, texVec[i].name, this.lightMapTexture, texVec[i].id);
	            }
	            else if (texVec[i].type == TexItem.LTUMAP && Scene_data.pubLut) {
	                Scene_data.context3D.setRenderTexture($material.shader, texVec[i].name, Scene_data.pubLut, texVec[i].id);
	                //_context.setTextureAt(texVec[i].id, Scene_data.prbLutTexture.texture);
	            }
	            else if (texVec[i].type == TexItem.CUBEMAP) {
	                if ($material.useDynamicIBL) ;
	                else {
	                    var index = Math.floor($material.roughness * 5);
	                    if (Scene_data.skyCubeMap) {
	                        var cubeTexture = Scene_data.skyCubeMap[index];
	                        Scene_data.context3D.setRenderTextureCube($material.program, texVec[i].name, cubeTexture, texVec[i].id);
	                    }
	                }
	            }
	            //else if (texVec[i].type == TexItem.HEIGHTMAP) {
	            //    //_context.setTextureAt(texVec[i].id, _cubeTexture);
	            //    setHeightTexture(texVec[i].id);
	            //} else if (texVec[i].type == TexItem.REFRACTIONMAP) {
	            //    if (_reflectionTextureVo) {
	            //        _context.setTextureAt(texVec[i].id, _reflectionTextureVo.ZeTexture);
	            //    }
	            //}
	            else {
	                //_context.setTextureAt(texVec[i].id, texVec[i].texture);
	                if (texVec[i].texture) {
	                    Scene_data.context3D.setRenderTexture($material.shader, texVec[i].name, texVec[i].texture, texVec[i].id);
	                }
	            }
	        }
	        if ($mp) {
	            for (i = 0; i < $mp.dynamicTexList.length; i++) {
	                //_context.setTextureAt($mParam.dynamicTexList[i].target.id, $mParam.dynamicTexList[i].texture);
	                if ($mp.dynamicTexList[i].target) {
	                    Scene_data.context3D.setRenderTexture($material.shader, $mp.dynamicTexList[i].target.name, $mp.dynamicTexList[i].texture, $mp.dynamicTexList[i].target.id);
	                }
	            }
	        }
	    }
	    checkMaterialTexture($material) {
	        var texVec = $material.texList;
	        for (var i = 0; i < texVec.length; i++) {
	            if (texVec[i].type == TexItem.LIGHTMAP) {
	                if (!this.lightMapTexture) {
	                    return false;
	                }
	            }
	            else if (texVec[i].type == TexItem.LTUMAP) {
	                if (!Scene_data.pubLut) {
	                    return false;
	                }
	            }
	            else if (texVec[i].type == TexItem.CUBEMAP) {
	                if ($material.useDynamicIBL) ;
	                else {
	                    if (!Scene_data.skyCubeMap) {
	                        return false;
	                    }
	                }
	            }
	            else {
	                if (!texVec[i].texture) {
	                    return false;
	                }
	            }
	        }
	        return true;
	    }
	    updateRotationMatrix() {
	        try {
	            this._rotationMatrix.identity();
	            this._rotationMatrix.appendRotation(this._rotationX, Vector3D.X_AXIS);
	            this._rotationMatrix.appendRotation(this._rotationY, Vector3D.Y_AXIS);
	            this._rotationMatrix.appendRotation(this._rotationZ, Vector3D.Z_AXIS);
	            if (this._rotationData) {
	                this._rotationMatrix.getRotaion(this._rotationData);
	            }
	        }
	        catch (err) {
	            //console.log("在此处理错误1");
	        }
	    }
	    setPos($v3d) {
	        this.x = $v3d.x;
	        this.y = $v3d.y + 10;
	        this.z = $v3d.z;
	    }
	    destory() {
	        super.destory();
	        this.name = null;
	        this.objurl = null;
	        this.picUrl = null;
	        this.materialUrl = null;
	        if (this.material) {
	            this.material.useNum--;
	        }
	        if (this.materialParam) {
	            this.materialParam.destory();
	            this.materialParam = null;
	        }
	        if (this.lightMapTextureRes) {
	            this.lightMapTextureRes.clearUseNum();
	        }
	        this._rotationMatrix = null;
	        this._rotationData = null;
	        this.bindMatrix = null;
	        this.bindTarget = null;
	        this.bindSocket = null;
	        this._groupPos = null;
	        this._groupRotation = null;
	        this._groupScale = null;
	        this.groupMatrix = null;
	        this.groupRotationMatrix = null;
	    }
	}

	class BitMapData {
	    constructor($w, $h) {
	        this.width = $w;
	        this.height = $h;
	        var $ctx = UIManager.getInstance().getContext2D(this.width, this.height, false);
	        this.imgData = $ctx.getImageData(0, 0, this.width, this.height);
	        for (var k = 0; k < this.imgData.data.length; k += 4) {
	            this.imgData.data[k + 0] = 255;
	            this.imgData.data[k + 1] = 255;
	            this.imgData.data[k + 2] = 255;
	            this.imgData.data[k + 3] = 255;
	        }
	    }
	    getIndexByPos($tx, $ty) {
	        var a = $ty * this.width + $tx;
	        return 4 * a;
	    }
	    setRgb($tx, $ty, $ve) {
	        $tx = Math.round($tx);
	        $ty = Math.round($ty);
	        var $idx = this.getIndexByPos($tx, $ty);
	        this.imgData.data[$idx + 0] = $ve.x * 255;
	        this.imgData.data[$idx + 1] = $ve.y * 255;
	        this.imgData.data[$idx + 2] = $ve.z * 255;
	        this.imgData.data[$idx + 3] = 255;
	    }
	    getRgb($tx, $ty) {
	        $tx = Math.round($tx);
	        $ty = Math.round($ty);
	        var $v = new Vector3D();
	        var $idx = this.getIndexByPos($tx, $ty);
	        $v.x = this.imgData.data[$idx + 0] / 255;
	        $v.y = this.imgData.data[$idx + 1] / 255;
	        $v.z = this.imgData.data[$idx + 2] / 255;
	        $v.w = 1;
	        return $v;
	    }
	}

	class Rectangle {
	    constructor($x = 0, $y = 0, $width = 1, $height = 1) {
	        this.x = 0;
	        this.y = 0;
	        this.width = 0;
	        this.height = 1;
	        this.x = $x;
	        this.y = $y;
	        this.width = $width;
	        this.height = $height;
	    }
	    sets($x, $y, $width, $height) {
	        this.x = $x;
	        this.y = $y;
	        this.width = $width;
	        this.height = $height;
	    }
	    setRec($rec) {
	        this.x = $rec.x;
	        this.y = $rec.y;
	        this.width = $rec.width;
	        this.height = $rec.height;
	    }
	    isHitByPoint(tx, ty) {
	        return (tx >= this.x && ty >= this.y && tx <= this.x + this.width && ty <= this.y + this.height);
	    }
	}

	class TerrainDisplay3DShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "v2TexCoord");
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec3 v3Position;" +
	            "attribute vec2 v2TexCoord;\n" +
	            "uniform mat4 viewMatrix3D;" +
	            "uniform mat4 camMatrix3D;" +
	            "uniform mat4 posMatrix3D;" +
	            "varying vec2 v0;\n" +
	            "void main(void)" +
	            "{" +
	            " v0 = v2TexCoord;" +
	            "   vec4 vt0= vec4(v3Position, 1.0);" +
	            "   vt0 = posMatrix3D * vt0;" +
	            "   vt0 = camMatrix3D * vt0;" +
	            "   vt0 = viewMatrix3D * vt0;" +
	            "   gl_Position = vt0;" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = "precision mediump float;" +
	            "uniform sampler2D idmaptexture;" +
	            "uniform sampler2D infotexture;" +
	            "uniform sampler2D sixtexture;" +
	            "uniform sampler2D lightexture;" +
	            "vec4 qdvNrm(float indx ,vec2 uvpos){" +
	            "vec2 sixuvTx=uvpos; " +
	            "float ccavid= floor(indx*255.0);" +
	            "if (ccavid==0.0) {\n" +
	            "} else  if (ccavid==1.0){\n" +
	            "sixuvTx.x=sixuvTx.x+0.5;" +
	            "} else  if (ccavid==2.0){" +
	            "sixuvTx.y=sixuvTx.y+0.5;" +
	            "}else{" +
	            "sixuvTx.x=sixuvTx.x+0.5;" +
	            "sixuvTx.y=sixuvTx.y+0.5;" +
	            "}; " +
	            "sixuvTx.x=sixuvTx.x+0.001;" +
	            "sixuvTx.y=sixuvTx.y+0.001;" +
	            "vec4 sixUvColor = texture2D(sixtexture, sixuvTx.xy);\n" +
	            "return  sixUvColor;\n" +
	            " }\n" +
	            "varying vec2 v0;" +
	            "void main(void)" +
	            "{" +
	            "vec4 idUv = texture2D(idmaptexture, v0.xy);\n" +
	            "vec4 infoUv = texture2D(infotexture, v0.xy);\n" +
	            "vec4 sixUv = texture2D(sixtexture, v0.xy);\n" +
	            "vec4 lightUv = texture2D(lightexture, v0*0.995+0.0025);\n" +
	            "vec2 sixuv=fract(v0*10.0); " +
	            " sixuv=sixuv*0.498; " +
	            "vec4 tempnumA = qdvNrm(idUv.x,sixuv) * infoUv.x;\n" +
	            "vec4 tempnumB = qdvNrm(idUv.y,sixuv) * infoUv.y;\n" +
	            "vec4 tempnumC = qdvNrm(idUv.z,sixuv) * infoUv.z;\n" +
	            "vec4 tempnumD = tempnumA+tempnumB+tempnumC;\n" +
	            " tempnumD.xyz=tempnumD.xyz*lightUv.xyz*2.0; " +
	            "gl_FragColor = tempnumD;" +
	            "}";
	        return $str;
	    }
	}
	TerrainDisplay3DShader.TerrainDisplay3DShader = "TerrainDisplay3DShader";

	class GroundDataMesh {
	    //处理成可以使用的2幂材质数据源
	    mekeUseTexture($img) {
	        var $textureRect = new Rectangle(0, 0, Math.pow(2, Math.ceil(Math.log($img.width) / Math.log(2))), Math.pow(2, Math.ceil(Math.log($img.height) / Math.log(2))));
	        if ($textureRect.width != $img.width || $textureRect.height != $img.height) {
	            var $temp = new BitMapData($textureRect.width, $textureRect.height);
	            for (var i = 0; i < $temp.width; i++) {
	                for (var j = 0; j < $temp.height; j++) {
	                    var $v = $img.getRgb(i / $temp.width * $img.width, j / $temp.height * $img.height);
	                    $temp.setRgb(i, j, $v);
	                }
	            }
	            //    //console.log("地形信息图调整:注需要编辑器地面设置为2幂")
	            return $temp;
	        }
	        else {
	            return $img;
	        }
	    }
	    calibration() {
	        this.idBitmap = this.mekeUseTexture(this.idBitmap);
	        this.infoBitmap = this.mekeUseTexture(this.infoBitmap);
	    }
	    static meshAllgroundData($byte) {
	        var cellNumX = $byte.readInt();
	        var cellNumZ = $byte.readInt();
	        var $groudItem = new Array();
	        for (var i = 0; i < cellNumX; i++) {
	            for (var j = 0; j < cellNumZ; j++) {
	                var tx = $byte.readInt();
	                var ty = $byte.readInt();
	                var $tw = $byte.readInt();
	                var $th = $byte.readInt();
	                var $groundDataMesh = new GroundDataMesh();
	                $groundDataMesh.idBitmap = new BitMapData($tw, $th);
	                $groundDataMesh.infoBitmap = new BitMapData($tw, $th);
	                $groundDataMesh.tx = tx;
	                $groundDataMesh.ty = ty;
	                $groudItem.push($groundDataMesh);
	                for (var k = 0; k < $tw; k++) {
	                    for (var h = 0; h < $th; h++) {
	                        var $vid;
	                        var $indexKey = $byte.readByte();
	                        switch ($indexKey) {
	                            case 0:
	                                $vid = new Vector3D(0, 1, 2);
	                                break;
	                            case 1:
	                                $vid = new Vector3D(0, 1, 3);
	                                break;
	                            case 2:
	                                $vid = new Vector3D(0, 2, 3);
	                                break;
	                            case 3:
	                                $vid = new Vector3D(1, 2, 3);
	                                break;
	                            default:
	                                throw new Error("信息索引没有编入");
	                            //break;
	                        }
	                        $groundDataMesh.idBitmap.setRgb(k, h, new Vector3D($vid.x / 255, $vid.y / 255, $vid.z / 255, 1));
	                        var $vinfo = new Vector3D();
	                        $vinfo.x = $byte.readByte() + 128;
	                        $vinfo.y = $byte.readByte() + 128;
	                        $vinfo.z = 255 - $vinfo.x - $vinfo.y;
	                        $groundDataMesh.infoBitmap.setRgb(k, h, new Vector3D($vinfo.x / 255, $vinfo.y / 255, $vinfo.z / 255, 1));
	                    }
	                }
	                $groundDataMesh.calibration();
	            }
	        }
	        var $sixUrl = $byte.readUTF();
	        for (var $tempidx = 0; $tempidx < $groudItem.length; $tempidx++) {
	            $groudItem[$tempidx].sixurl = $sixUrl;
	        }
	        return $groudItem;
	    }
	}
	class TerrainDisplay3DSprite extends Display3DSprite {
	    constructor() {
	        super();
	        ProgramManager.getInstance().registe(TerrainDisplay3DShader.TerrainDisplay3DShader, new TerrainDisplay3DShader());
	        this.groundShader = ProgramManager.getInstance().getProgram(TerrainDisplay3DShader.TerrainDisplay3DShader);
	    }
	    update() {
	        if (this.groundShader && this.baseSixteenRes && this.idMapPicDataTexture) {
	            this.upDataToDraw();
	        }
	        else {
	            super.update();
	        }
	    }
	    upDataToDraw() {
	        if (this.groundShader && this.baseSixteenRes) {
	            Scene_data.context3D.cullFaceBack(false);
	            Scene_data.context3D.setProgram(this.groundShader.program);
	            Scene_data.context3D.setVcMatrix4fv(this.groundShader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	            Scene_data.context3D.setVcMatrix4fv(this.groundShader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	            Scene_data.context3D.setVcMatrix4fv(this.groundShader, "posMatrix3D", this.posMatrix.m);
	            Scene_data.context3D.setVc4fv(this.groundShader, "colorData", [1, 0, 1, 1]);
	            var tf = Scene_data.context3D.pushVa(this.objData.vertexBuffer);
	            if (!tf) {
	                Scene_data.context3D.setVaOffset(0, 3, this.objData.stride, 0);
	                Scene_data.context3D.setVaOffset(1, 2, this.objData.stride, this.objData.uvsOffsets);
	            }
	            Scene_data.context3D.setRenderTexture(this.groundShader, "idmaptexture", this.idMapPicDataTexture, 0);
	            Scene_data.context3D.setRenderTexture(this.groundShader, "infotexture", this.infoMapPicDataTexture, 1);
	            Scene_data.context3D.setRenderTexture(this.groundShader, "sixtexture", this.baseSixteenRes.texture, 2);
	            Scene_data.context3D.setRenderTexture(this.groundShader, "lightexture", this.lightMapTexture, 3);
	            Scene_data.context3D.drawCall(this.objData.indexBuffer, this.objData.treNum);
	        }
	    }
	    setGrounDataMesh($groundDataMesh) {
	        this.idMapPicDataTexture = Scene_data.context3D.getTexture($groundDataMesh.idBitmap.imgData, 0, 1);
	        this.infoMapPicDataTexture = Scene_data.context3D.getTexture($groundDataMesh.infoBitmap.imgData, 0, 1);
	        var $textureUrl = $groundDataMesh.sixurl;
	        TextureManager.getInstance().getTexture(Scene_data.fileRoot + $textureUrl, ($texture) => {
	            this.baseSixteenRes = $texture;
	        });
	    }
	}

	class AnimManager {
	    constructor() {
	        this._dic = new Object();
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new AnimManager();
	        }
	        return this._instance;
	    }
	    getAnimData($url, $fun) {
	        if (this._dic[$url]) {
	            $fun(this._dic[$url]);
	            return;
	        }
	        LoadManager.getInstance().load($url, LoadManager.BYTE_TYPE, ($byte, _fun) => {
	            //this.loadObjCom($byte, _fun, $url);
	            var animData = this.readData(new Pan3dByteArray($byte), $url);
	            _fun(animData);
	        }, $fun);
	    }
	    getAnimDataImmediate($url) {
	        return this._dic[$url];
	    }
	    clearAnim($url) {
	        delete this._dic[$url];
	    }
	    readData(byte, $url) {
	        var hierarchyList = new Array;
	        var frameAry = new Array;
	        var animData = new AnimData();
	        animData.inLoop = byte.readInt();
	        var numLength = byte.readInt();
	        for (var i = 0; i < numLength; i++) {
	            animData.inter.push(byte.readInt());
	        }
	        numLength = byte.readInt();
	        for (var i = 0; i < numLength; i++) {
	            animData.bounds.push(byte.readVector3D());
	        }
	        animData.nameHeight = byte.readInt();
	        numLength = byte.readInt();
	        for (var i = 0; i < numLength; i++) {
	            var objBone = new ObjectBone();
	            objBone.father = byte.readInt();
	            objBone.changtype = byte.readInt();
	            objBone.startIndex = byte.readInt();
	            objBone.tx = byte.readFloat();
	            objBone.ty = byte.readFloat();
	            objBone.tz = byte.readFloat();
	            objBone.qx = byte.readFloat();
	            objBone.qy = byte.readFloat();
	            objBone.qz = byte.readFloat();
	            hierarchyList.push(objBone);
	        }
	        this.readFrameData(byte, frameAry);
	        numLength = byte.readInt();
	        for (var i = 0; i < numLength; i++) {
	            animData.posAry.push(byte.readVector3D());
	        }
	        animData.matrixAry = this.processFrame(frameAry, hierarchyList);
	        this._dic[$url] = animData;
	        return animData;
	    }
	    readFrameData(byte, frameAry) {
	        var $frameTyeArr = this.readFrameTypeData(byte);
	        var $isStand = byte.readBoolean(); //是否为站立，这里特殊给站立的旋转设置其权重值不压缩
	        var $scaleNum = byte.readFloat();
	        var numLength = byte.readInt();
	        for (var i = 0; i < numLength; i++) {
	            var frameItemAryLength = byte.readInt();
	            var frameItemAry = new Array;
	            frameAry.push(frameItemAry);
	            for (var j = 0; j < frameItemAryLength; j++) {
	                if ($frameTyeArr[j]) {
	                    frameItemAry.push(byte.readFloatTwoByte($scaleNum));
	                }
	                else {
	                    if ($isStand) { //注意这里的特殊，针对站立时的旋转精度用浮点
	                        frameItemAry.push(byte.readFloat());
	                    }
	                    else {
	                        frameItemAry.push(byte.readShort() / 32767);
	                    }
	                }
	            }
	        }
	    }
	    readFrameTypeData(byte) {
	        var $arr = new Array;
	        var numLength = byte.readInt();
	        for (var i = 0; i < numLength; i++) {
	            $arr.push(byte.readBoolean());
	        }
	        return $arr;
	    }
	    processFrame(frameAry, hierarchyList) {
	        var newFrameAry = new Array;
	        for (var i = 0; i < frameAry.length; i++) {
	            newFrameAry.push(this.frameToBone(frameAry[i], hierarchyList));
	        }
	        return this.setFrameToMatrix(newFrameAry);
	    }
	    frameToBone(frameData, hierarchyList) {
	        var _arr = new Array;
	        for (var i = 0; i < hierarchyList.length; i++) {
	            var _temp = new ObjectBaseBone();
	            _temp.father = hierarchyList[i].father;
	            var k = 0;
	            if (hierarchyList[i].changtype & 1) {
	                _temp.tx = frameData[hierarchyList[i].startIndex + k];
	                ++k;
	            }
	            else {
	                _temp.tx = hierarchyList[i].tx;
	            }
	            if (hierarchyList[i].changtype & 2) {
	                _temp.ty = frameData[hierarchyList[i].startIndex + k];
	                ++k;
	            }
	            else {
	                _temp.ty = hierarchyList[i].ty;
	            }
	            if (hierarchyList[i].changtype & 4) {
	                _temp.tz = frameData[hierarchyList[i].startIndex + k];
	                ++k;
	            }
	            else {
	                _temp.tz = hierarchyList[i].tz;
	            }
	            if (hierarchyList[i].changtype & 8) {
	                _temp.qx = frameData[hierarchyList[i].startIndex + k];
	                ++k;
	            }
	            else {
	                _temp.qx = hierarchyList[i].qx;
	            }
	            if (hierarchyList[i].changtype & 16) {
	                _temp.qy = frameData[hierarchyList[i].startIndex + k];
	                ++k;
	            }
	            else {
	                _temp.qy = hierarchyList[i].qy;
	            }
	            if (hierarchyList[i].changtype & 32) {
	                _temp.qz = frameData[hierarchyList[i].startIndex + k];
	                ++k;
	            }
	            else {
	                _temp.qz = hierarchyList[i].qz;
	            }
	            _arr.push(_temp);
	        }
	        return _arr;
	    }
	    setFrameToMatrix(frameAry) {
	        var matrixAry = new Array;
	        for (var j = 0; j < frameAry.length; j++) {
	            var boneAry = frameAry[j];
	            var Q0 = new Quaternion();
	            var newM = new Matrix3D();
	            var frameMatrixAry = new Array;
	            matrixAry.push(frameMatrixAry);
	            for (var i = 0; i < boneAry.length; i++) {
	                var xyzfarme0 = boneAry[i];
	                Q0 = new Quaternion(xyzfarme0.qx, xyzfarme0.qy, xyzfarme0.qz);
	                Q0.w = this.getW(Q0.x, Q0.y, Q0.z);
	                if (xyzfarme0.father == -1) {
	                    newM = Q0.toMatrix3D();
	                    newM.appendTranslation(xyzfarme0.tx, xyzfarme0.ty, xyzfarme0.tz);
	                    newM.appendRotation(-90, Vector3D.X_AXIS);
	                    //xyzfarme0.matrix = newM;
	                    frameMatrixAry.push(newM);
	                }
	                else {
	                    var fatherBone = boneAry[xyzfarme0.father];
	                    newM = Q0.toMatrix3D();
	                    newM.appendTranslation(xyzfarme0.tx, xyzfarme0.ty, xyzfarme0.tz);
	                    //newM.append(fatherBone.matrix);
	                    newM.append(frameMatrixAry[xyzfarme0.father]);
	                    frameMatrixAry.push(newM);
	                    //xyzfarme0.matrix = newM;
	                }
	            }
	            for (i = 0; i < frameMatrixAry.length; i++) {
	                frameMatrixAry[i].appendScale(-1, 1, 1); //特别标记，因为四元数和矩阵运算结果不一  先存正确的矩阵
	                //xyzfarme0.matrix.appendScale(-1, 1, 1);
	            }
	        }
	        return matrixAry;
	    }
	    getW(x, y, z) {
	        var t = 1 - (x * x + y * y + z * z);
	        if (t < 0) {
	            t = 0;
	        }
	        else {
	            t = -Math.sqrt(t);
	        }
	        return t;
	    }
	}
	class ObjectBaseBone {
	}
	class ObjectBone extends ObjectBaseBone {
	    clone() {
	        var newBone = new ObjectBone;
	        newBone.tx = this.tx;
	        newBone.ty = this.ty;
	        newBone.tz = this.tz;
	        newBone.tw = this.tw;
	        newBone.qx = this.qx;
	        newBone.qy = this.qy;
	        newBone.qz = this.qz;
	        newBone.qw = this.qw;
	        newBone.changtype = this.changtype;
	        newBone.name = this.name;
	        newBone.father = this.father;
	        newBone.startIndex = this.startIndex;
	        newBone.matrix = this.matrix;
	        return newBone;
	    }
	}

	class SkinMesh extends ResCount {
	    constructor() {
	        super(...arguments);
	        this.meshAry = new Array;
	        this.fileScale = 1;
	        this.tittleHeight = 0;
	        this.hitBox = new Vector2D(0, 0);
	        this.type = 0;
	        this.animDic = new Object;
	        this.ready = false;
	        this.hasDestory = false;
	    }
	    makeHitBoxItem() {
	        this.hitPosItem = new Array;
	        var w = this.hitBox.x;
	        var h = this.hitBox.y;
	        var a = new Vector3D(-w, 0, -w);
	        var b = new Vector3D(w, 0, -w);
	        var c = new Vector3D(w, 0, w);
	        var d = new Vector3D(-w, 0, w);
	        this.hitPosItem.push(a);
	        this.hitPosItem.push(b);
	        this.hitPosItem.push(c);
	        this.hitPosItem.push(d);
	        var a1 = new Vector3D(-w, h, -w);
	        var b1 = new Vector3D(w, h, -w);
	        var c1 = new Vector3D(w, h, w);
	        var d1 = new Vector3D(-w, h, w);
	        this.hitPosItem.push(a1);
	        this.hitPosItem.push(b1);
	        this.hitPosItem.push(c1);
	        this.hitPosItem.push(d1);
	    }
	    addMesh($mesh) {
	        $mesh.uid = this.meshAry.length;
	        this.meshAry.push($mesh);
	    }
	    loadParticle() {
	    }
	    loadMaterial($fun = null) {
	        for (var i = 0; i < this.meshAry.length; i++) {
	            this.loadByteMeshDataMaterial(this.meshAry[i], $fun);
	        }
	    }
	    loadByteMeshDataMaterial($meshData, $fun = null) {
	        var url = Scene_data.fileRoot + $meshData.materialUrl;
	        url = url.replace("_byte.txt", ".txt");
	        url = url.replace(".txt", "_byte.txt");
	        MaterialManager.getInstance().getMaterialByte(url, ($material) => {
	            $meshData.material = $material;
	            /*             if ($material.usePbr) {
	                            MeshDataManager.getInstance().uploadPbrMesh($meshData, $material.useNormal);
	                        } else if ($material.lightProbe || $material.directLight) {
	                            MeshDataManager.getInstance().uploadPbrMesh($meshData, false);
	                        } */
	            if ($meshData.materialParamData) {
	                $meshData.materialParam = new MaterialBaseParam();
	                $meshData.materialParam.setData($meshData.material, $meshData.materialParamData);
	            }
	            if ($fun) {
	                $fun($material);
	            }
	        }, null, true, MaterialAnimShader.MATERIAL_ANIM_SHADER, MaterialAnimShader);
	    }
	    setAction(actionAry, roleUrl) {
	        this.animUrlAry = new Array;
	        for (var i = 0; i < actionAry.length; i++) {
	            var name = actionAry[i];
	            var url = roleUrl + actionAry[i];
	            var anim = AnimManager.getInstance().getAnimDataImmediate(url);
	            anim.processMesh(this);
	            this.animDic[name] = anim;
	            this.animUrlAry.push(url);
	        }
	    }
	    destory() {
	        if (this.allParticleDic) {
	            for (var key in this.allParticleDic) {
	                ParticleManager.getInstance().releaseUrl(key);
	            }
	            this.allParticleDic = null;
	        }
	        for (var i = 0; i < this.meshAry.length; i++) {
	            this.meshAry[i].destory();
	        }
	        this.meshAry.length = 0;
	        this.meshAry = null;
	        this.boneSocketDic = null;
	        if (this.animUrlAry) {
	            for (var i = 0; i < this.animUrlAry.length; i++) {
	                AnimManager.getInstance().clearAnim(this.animUrlAry[i]);
	            }
	            this.animUrlAry.length = 0;
	            this.animUrlAry = null;
	        }
	        for (var key in this.animDic) {
	            delete this.animDic[key];
	        }
	        this.animDic = null;
	        this.hasDestory = true;
	    }
	}

	class BoneSocketData {
	    clone() {
	        var result = new BoneSocketData();
	        result.name = this.name + BoneSocketData.cloneIDIndex;
	        result.boneName = this.boneName;
	        result.index = this.index;
	        result.x = this.x;
	        result.y = this.y;
	        result.z = this.z;
	        result.rotationX = this.rotationX;
	        result.rotationY = this.rotationY;
	        result.rotationZ = this.rotationZ;
	        return result;
	    }
	}
	BoneSocketData.cloneIDIndex = 0;

	class MeshDataManager extends ResGC {
	    constructor() {
	        super();
	        this._loadDic = new Object();
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new MeshDataManager();
	        }
	        return this._instance;
	    }
	    getMeshData($url, $fun, $batchNum = 1) {
	        if (this._dic[$url] && this._dic[$url].ready) {
	            $fun(this._dic[$url]);
	            this._dic[$url].useNum++;
	            return;
	        }
	        let funs;
	        if (this._loadDic[$url]) {
	            funs = this._loadDic[$url];
	            funs.push($fun);
	            return;
	        }
	        funs = this._loadDic[$url] = [];
	        funs.push($fun);
	        ResManager.getInstance().loadRoleRes(Scene_data.fileRoot + $url, ($roleRes) => {
	            this.roleResCom($roleRes, $fun);
	        }, $batchNum);
	    }
	    roleResCom($roleRes, $fun) {
	        var url = $roleRes.roleUrl;
	        var skinMesh = this._dic[url];
	        skinMesh.loadMaterial();
	        //skinMesh.loadParticle();
	        skinMesh.setAction($roleRes.actionAry, url);
	        skinMesh.url = url;
	        if ($roleRes.ambientLightColor) {
	            skinMesh.lightData = [[$roleRes.ambientLightColor.x, $roleRes.ambientLightColor.y, $roleRes.ambientLightColor.z],
	                [$roleRes.nrmDircet.x, $roleRes.nrmDircet.y, $roleRes.nrmDircet.z],
	                [$roleRes.sunLigthColor.x, $roleRes.sunLigthColor.y, $roleRes.sunLigthColor.z]];
	        }
	        var funs = this._loadDic[url];
	        console.assert(funs != undefined, `找不到定义`);
	        for (var i = 0; i < funs.length; i++) {
	            funs[i](skinMesh);
	            skinMesh.useNum++;
	        }
	        delete this._loadDic[url];
	        skinMesh.ready = true;
	        //this._dic[$roleRes.roleUrl] = skinMesh;
	        //$fun(skinMesh);
	        //var meshUrl: string = $roleRes.roleUrl;
	        //MeshDataManager.getInstance().getMeshData(meshUrl, ($skinMesh: SkinMesh) => {
	        //    if ($batchNum != 1) {
	        //        $roleRes.type = 1;
	        //    }
	        //    for (var key in this._animDic) {
	        //        this.processAnimByMesh(this._animDic[key]);
	        //    }
	        //    $skinMesh.loadMaterial(($m: Material) => { this.loadMaterialCom($m) });
	        //    $skinMesh.loadParticle(this);
	        //    this.fileScale = $skinMesh.fileScale;
	        //}, $batchNum);
	        //var actionAry: Array<string> = this._roleRes.actionAry;
	        //for (var i: number = 0; i < actionAry.length; i++) {
	        //    this.addAction(actionAry[i], this._roleRes.roleUrl + actionAry[i]);
	        //}
	    }
	    gc() {
	        super.gc();
	    }
	    readData(byte, $batchNum, $url, $version) {
	        var $skinMesh = new SkinMesh();
	        $skinMesh.fileScale = byte.readFloat();
	        if ($version >= 19) {
	            $skinMesh.tittleHeight = byte.readFloat();
	        }
	        else {
	            $skinMesh.tittleHeight = 50;
	        }
	        $skinMesh.hitBox = new Vector2D(20, 20);
	        if ($version >= 23) {
	            $skinMesh.hitBox.x = byte.readFloat();
	            $skinMesh.hitBox.y = byte.readFloat();
	        }
	        $skinMesh.makeHitBoxItem();
	        var meshNum = byte.readInt();
	        var allParticleDic = new Object;
	        for (var i = 0; i < meshNum; i++) {
	            var meshData = new MeshData;
	            // if ($version >= 35) {
	            meshData.bindPosAry = this.readBindPosByte(byte);
	            meshData.getBindPosMatrix();
	            // }
	            // if ($version >= 21) {
	            this.readMesh2OneBuffer(byte, meshData);
	            /*             } else {
	                            BaseRes.readFloatTwoByte(byte, meshData.vertices);
	                            BaseRes.readFloatTwoByte(byte, meshData.tangents);
	                            BaseRes.readFloatTwoByte(byte, meshData.bitangents);
	                            BaseRes.readFloatTwoByte(byte, meshData.normals);
	                            BaseRes.readFloatTwoByte(byte, meshData.uvs);
	            
	                            BaseRes.readIntForOneByte(byte, meshData.boneIDAry);
	                            BaseRes.readFloatOneByte(byte, meshData.boneWeightAry);
	            
	                            BaseRes.readIntForTwoByte(byte, meshData.indexs);
	                            BaseRes.readIntForTwoByte(byte, meshData.boneNewIDAry);
	            
	                            this.uploadMesh(meshData);
	                        } */
	            meshData.treNum = meshData.layaIndexBuffer.indexCount;
	            // if ($batchNum != 1) {
	            //     this.cloneMeshData(meshData, $batchNum);
	            // }
	            meshData.materialUrl = byte.readUTF();
	            meshData.materialParamData = BaseRes.readMaterialParamData(byte);
	            var particleNum = byte.readInt();
	            for (var j = 0; j < particleNum; j++) {
	                var bindParticle = new BindParticle(byte.readUTF(), byte.readUTF());
	                meshData.particleAry.push(bindParticle);
	                allParticleDic[bindParticle.url] = true;
	            }
	            $skinMesh.addMesh(meshData);
	        }
	        for (var key in allParticleDic) {
	            ParticleManager.getInstance().registerUrl(key);
	        }
	        $skinMesh.allParticleDic = allParticleDic;
	        if ($version < 35) { //多个MESH出错后情况
	            var bindPosAry = this.readBindPosByte(byte);
	            for (var w = 0; w < $skinMesh.meshAry.length; w++) {
	                $skinMesh.meshAry[w].bindPosAry = bindPosAry;
	                $skinMesh.meshAry[w].getBindPosMatrix();
	            }
	        }
	        var sokcetLenght = byte.readInt();
	        $skinMesh.boneSocketDic = new Object();
	        for (var j = 0; j < sokcetLenght; j++) {
	            var boneData = new BoneSocketData();
	            boneData.name = byte.readUTF();
	            boneData.boneName = byte.readUTF();
	            boneData.index = byte.readInt();
	            boneData.x = byte.readFloat();
	            boneData.y = byte.readFloat();
	            boneData.z = byte.readFloat();
	            boneData.rotationX = byte.readFloat();
	            boneData.rotationY = byte.readFloat();
	            boneData.rotationZ = byte.readFloat();
	            $skinMesh.boneSocketDic[boneData.name] = boneData;
	        }
	        this._dic[$url] = $skinMesh;
	        return $skinMesh;
	    }
	    readBindPosByte(byte) {
	        var bindPosLength = byte.readInt();
	        var bindPosAry = new Array;
	        for (var j = 0; j < bindPosLength; j++) {
	            var ary = new Array(byte.readFloat(), byte.readFloat(), byte.readFloat(), byte.readFloat(), byte.readFloat(), byte.readFloat());
	            bindPosAry.push(ary);
	        }
	        return bindPosAry;
	    }
	    readMesh2OneBuffer(byte, meshData) {
	        var len = byte.readInt();
	        var typeItem = new Array;
	        var dataWidth = 0;
	        for (var i = 0; i < 5; i++) {
	            var tf = byte.readBoolean();
	            typeItem.push(tf);
	            if (tf) {
	                if (i == 1) {
	                    dataWidth += 2;
	                }
	                else {
	                    dataWidth += 3;
	                }
	            }
	        }
	        dataWidth += 8;
	        dataWidth = 13;
	        let vertexFlag = "POSITION,UV,BLENDINDICES,BLENDWEIGHT";
	        let vertexDeclaration = VertexMesh.getVertexDeclaration(vertexFlag, true);
	        let stride = vertexDeclaration.vertexStride;
	        len *= stride;
	        var uvsOffsets = 3; // 1
	        var normalsOffsets = uvsOffsets + 2; // 2
	        var tangentsOffsets = normalsOffsets + 3; //3
	        var bitangentsOffsets = tangentsOffsets + 3; //4
	        var boneIDOffsets;
	        if (typeItem[2]) { //normal
	            if (typeItem[4]) {
	                boneIDOffsets = bitangentsOffsets + 3;
	            }
	            else {
	                boneIDOffsets = normalsOffsets + 3;
	            }
	        }
	        else {
	            boneIDOffsets = uvsOffsets + 2;
	        }
	        var boneWeightOffsets = boneIDOffsets + 4;
	        var arybuff = new ArrayBuffer(len);
	        var data = new DataView(arybuff);
	        BaseRes.readBytes2ArrayBuffer(byte, data, 3, 0, dataWidth); //vertices
	        BaseRes.readBytes2ArrayBuffer(byte, data, 2, uvsOffsets, dataWidth); //uvs
	        BaseRes.readBytes2ArrayBuffer(byte, null, 3, normalsOffsets, dataWidth); //normals
	        BaseRes.readBytes2ArrayBuffer(byte, null, 3, tangentsOffsets, dataWidth); //tangents
	        BaseRes.readBytes2ArrayBuffer(byte, null, 3, bitangentsOffsets, dataWidth); //bitangents
	        BaseRes.readBytes2ArrayBuffer(byte, data, 4, boneIDOffsets, dataWidth, 2); //boneIDAry
	        BaseRes.readBytes2ArrayBuffer(byte, data, 4, boneWeightOffsets, dataWidth, 1); //boneWeightAry
	        // BaseRes.readFloatTwoByte(byte, meshData.vertices);
	        // BaseRes.readFloatTwoByte(byte, meshData.uvs);
	        // BaseRes.readFloatTwoByte(byte, meshData.normals);
	        // BaseRes.readFloatTwoByte(byte, meshData.tangents);
	        // BaseRes.readFloatTwoByte(byte, meshData.bitangents);
	        // BaseRes.readIntForOneByte(byte, meshData.boneIDAry);
	        // BaseRes.readFloatOneByte(byte, meshData.boneWeightAry);
	        let indices = BaseRes.readIntForTwoByteNew(byte);
	        // BaseRes.readIntForTwoByte(byte, meshData.indexs);
	        BaseRes.readIntForTwoByte(byte, meshData.boneNewIDAry);
	        meshData.compressBuffer = true;
	        meshData.uvsOffsets = uvsOffsets * 4;
	        meshData.normalsOffsets = normalsOffsets * 4;
	        meshData.tangentsOffsets = tangentsOffsets * 4;
	        meshData.bitangentsOffsets = bitangentsOffsets * 4;
	        meshData.boneIDOffsets = boneIDOffsets * 4;
	        meshData.boneWeightOffsets = boneWeightOffsets * 4;
	        meshData.stride = dataWidth * 4;
	        let vertexBuffer = new VertexBuffer3D(arybuff.byteLength, WebGLRenderingContext.STATIC_DRAW, true);
	        vertexBuffer.vertexDeclaration = vertexDeclaration;
	        vertexBuffer.setData(arybuff);
	        meshData.layaVertexBuffer = vertexBuffer;
	        // meshData.vertexBuffer = Scene_data.context3D.uploadBuff3DArrayBuffer(arybuff);
	        var indexBuffer = new IndexBuffer3D(meshData.indexFormat, indices.length, WebGLRenderingContext.STATIC_DRAW, false);
	        indexBuffer.setData(indices);
	        meshData.layaIndexBuffer = indexBuffer;
	        meshData._setBuffer(vertexBuffer, indexBuffer);
	        // meshData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(meshData.indexs);
	    }
	    /*    private cloneMeshData(meshData: MeshData, num: number): void {
	   
	           var vertices: Array<number> = meshData.vertices;
	           var normals: Array<number> = meshData.normals;
	           var uvs: Array<number> = meshData.uvs;
	           var bonetIDAry: Array<number> = meshData.boneIDAry;
	           var boneWeightAry: Array<number> = meshData.boneWeightAry;
	           var indexs: Array<number> = meshData.indexs;
	   
	           meshData.vertices = new Array;
	           meshData.normals = new Array;
	           meshData.uvs = new Array;
	           meshData.boneIDAry = new Array;
	           meshData.boneWeightAry = new Array;
	           meshData.indexs = new Array;
	   
	           var vesNum: number = vertices.length / 3;
	   
	           for (var i: number = 0; i < num; i++) {
	               meshData.vertices = meshData.vertices.concat(vertices);
	               meshData.normals = meshData.normals.concat(normals);
	               meshData.boneIDAry = meshData.boneIDAry.concat(bonetIDAry);
	               meshData.boneWeightAry = meshData.boneWeightAry.concat(boneWeightAry);
	   
	               for (var j: number = 0; j < uvs.length; j += 2) {
	                   meshData.uvs.push(uvs[j], uvs[j + 1], i);
	               }
	   
	               for (var j: number = 0; j < indexs.length; j++) {
	                   meshData.indexs.push(indexs[j] + i * vesNum);
	               }
	   
	           }
	           meshData.treNum = meshData.indexs.length;
	   
	       }
	       private uploadMesh($mesh: MeshData): void {
	           $mesh.vertexBuffer = Scene_data.context3D.uploadBuff3D($mesh.vertices);
	           $mesh.uvBuffer = Scene_data.context3D.uploadBuff3D($mesh.uvs);
	           $mesh.boneIdBuffer = Scene_data.context3D.uploadBuff3D($mesh.boneIDAry);
	           $mesh.boneWeightBuffer = Scene_data.context3D.uploadBuff3D($mesh.boneWeightAry);
	           $mesh.indexBuffer = Scene_data.context3D.uploadIndexBuff3D($mesh.indexs);
	       } */
	    /*     public uploadPbrMesh($mesh: MeshData, $useNormal: boolean): void {
	            $mesh.normalsBuffer = Scene_data.context3D.uploadBuff3D($mesh.normals);
	    
	            if ($useNormal) {
	                $mesh.tangentBuffer = Scene_data.context3D.uploadBuff3D($mesh.tangents);
	                $mesh.bitangentBuffer = Scene_data.context3D.uploadBuff3D($mesh.bitangents);
	            }
	    
	        } */
	    preLoad($url) {
	        this.getMeshData($url, ($skinMesh) => {
	            $skinMesh.loadMaterial();
	        });
	    }
	}

	class RoleRes extends BaseRes {
	    constructor() {
	        super();
	        this.actionNum = 0;
	        this.actionIndex = 0;
	        //资源状态
	        this.resState = "none";
	        //开始加载
	        this.NONE = "none";
	        //读取mesh
	        this.READ_MESH = "read_mesh";
	        //读取动作
	        this.READ_ACTION = "read_action";
	        //读取贴图
	        this.READ_IMAGE = "read_image";
	        //读取贴图
	        this.READ_IMAGE_LOADING = "read_image_loading";
	        //读取材质
	        this.READ_MATERIAL = "read_material";
	        //读取粒子
	        this.READ_PARTICLE = "read_particle";
	        //读取资源完毕
	        this.READ_COMPLETE = "read_complete";
	        //心跳
	        this.updateTick = () => {
	            this.updateState();
	        };
	        this.meshBatchNum = 1;
	    }
	    load(url, $fun) {
	        this._fun = $fun;
	        LoadManager.getInstance().load(url, LoadManager.BYTE_TYPE, ($byte) => {
	            this.loadComplete($byte);
	        });
	    }
	    //更新资源状态
	    updateState() {
	        switch (this.resState) {
	            case this.READ_MESH: //1.加载三角面
	                // console.log("updateState 1.加载三角面");
	                this.readMesh();
	                break;
	            case this.READ_ACTION: //2.读取动作
	                // console.log("updateState 2.读取动作");
	                this.readAction(); //这里是循环多次的
	                break;
	            case this.READ_IMAGE: //3.读取贴图
	                this.resState = this.READ_IMAGE_LOADING;
	                // console.log("updateState 3.读取贴图");
	                this.read();
	                break;
	            case this.READ_MATERIAL: //4.读取材质
	                // console.log("updateState 4.读取材质");
	                this.read();
	                break;
	            case this.READ_PARTICLE: //5.读取粒子
	                // console.log("updateState 5.读取粒子");
	                this.read();
	                break;
	            case this.READ_COMPLETE:
	                // console.log("updateState READ_COMPLETE");
	                TimeUtil.removeFrameTick(this.updateTick);
	                if (this._fun) {
	                    this._fun();
	                    this._fun = null;
	                }
	                break;
	        }
	    }
	    //角色配置文件加载完毕
	    loadComplete($byte) {
	        this._byte = new Pan3dByteArray($byte);
	        this._byte.position = 0;
	        this.version = this._byte.readInt();
	        this.resState = this.READ_MESH; //1.开始加载
	        TimeUtil.addFrameTick(this.updateTick);
	    }
	    //读取三角面
	    readMesh() {
	        this.roleUrl = this._byte.readUTF();
	        if (this.version >= 16) { //环境参数
	            this.ambientLightColor = new Vector3D;
	            this.sunLigthColor = new Vector3D;
	            this.nrmDircet = new Vector3D;
	            this.ambientLightColor.x = this._byte.readFloat();
	            this.ambientLightColor.y = this._byte.readFloat();
	            this.ambientLightColor.z = this._byte.readFloat();
	            this.ambientLightIntensity = this._byte.readFloat();
	            this.ambientLightColor.scaleBy(this.ambientLightIntensity);
	            this.sunLigthColor.x = this._byte.readFloat();
	            this.sunLigthColor.y = this._byte.readFloat();
	            this.sunLigthColor.z = this._byte.readFloat();
	            this.sunLigthIntensity = this._byte.readFloat();
	            this.sunLigthColor.scaleBy(this.sunLigthIntensity);
	            this.nrmDircet.x = this._byte.readFloat();
	            this.nrmDircet.y = this._byte.readFloat();
	            this.nrmDircet.z = this._byte.readFloat();
	        }
	        MeshDataManager.getInstance().readData(this._byte, this.meshBatchNum, this.roleUrl, this.version);
	        //开始读取动作
	        this.readActions();
	    }
	    /**读取动作*/
	    readActions() {
	        if (this.version >= 30) {
	            this.actionByte = Util.getZipByte(this._byte);
	        }
	        else {
	            this.actionByte = this._byte;
	        }
	        this.actionAry = new Array;
	        this.actionNum = this.actionByte.readInt();
	        this.resState = this.READ_ACTION; //读完mesh读动作
	    }
	    /**读取单个动作*/
	    readAction() {
	        if (this.actionIndex >= this.actionNum) { //动作读完就读图片
	            this.resState = this.READ_IMAGE;
	            return;
	        }
	        var actionName = this.actionByte.readUTF();
	        AnimManager.getInstance().readData(this.actionByte, this.roleUrl + actionName);
	        this.actionAry.push(actionName);
	        this.actionIndex++;
	    }
	    /**图片读取完毕*/
	    allResCom() {
	        this.resState = this.READ_MATERIAL; //读完图片读材质
	        this.actionByte = null; //动作用完就清空
	        this.actionNum = 0;
	        this.actionIndex = 0;
	    }
	    /**读取材质*/
	    readMaterial() {
	        super.readMaterial();
	        this.resState = this.READ_PARTICLE; //读完材质，读粒子
	    }
	    /**读取粒子*/
	    readParticle() {
	        super.readParticle();
	        this.resState = this.READ_COMPLETE; //读完粒子就结束
	    }
	}

	class SkillKeyVo {
	    constructor() {
	        this.frame = 0;
	    }
	    setData($data) {
	        this.frame = $data.frame;
	        this.url = $data.url;
	    }
	}
	class SkillShockVo {
	    setData($data) {
	        this.time = $data.time * Scene_data.frameTime;
	        this.lasttime = $data.lasttime * Scene_data.frameTime;
	        this.amp = $data.amp;
	    }
	}
	class SkillFixEffectKeyVo extends SkillKeyVo {
	    setData($data) {
	        super.setData($data);
	        this.hasSocket = $data.hasSocket;
	        if (this.hasSocket) {
	            this.socket = $data.socket;
	        }
	        else {
	            this.pos = new Vector3D($data.pos.x, $data.pos.y, $data.pos.z);
	            this.rotation = new Vector3D($data.rotation.x, $data.rotation.y, $data.rotation.z);
	        }
	    }
	}
	class SkillTrajectoryTargetKeyVo extends SkillKeyVo {
	    setData($data) {
	        super.setData($data);
	        this.beginType = $data.beginType;
	        if (this.beginType == 0) {
	            this.beginPos = new Vector3D($data.beginPos.x, $data.beginPos.y, $data.beginPos.z);
	        }
	        else if (this.beginType == 1) {
	            this.beginSocket = $data.beginSocket;
	        }
	        this.speed = $data.speed;
	        if ($data.hitSocket) {
	            this.hitSocket = $data.hitSocket;
	        }
	        if ($data.endParticle) {
	            this.endParticleUrl = $data.endParticle;
	        }
	        this.multype = $data.multype;
	    }
	}

	class SkillVo {
	    setData($info) {
	        this.keyAry = new Array;
	        this.action = $info.action;
	        this.skillname = $info.skillname;
	        this.bloodTime = $info.blood;
	        this.types = $info.type;
	        if (this.types == SkillType.FixEffect) {
	            this.keyAry = this.getFixEffect($info.data);
	        }
	        else if (this.types == SkillType.TrajectoryDynamicTarget || this.types == SkillType.TrajectoryDynamicPoint) {
	            this.keyAry = this.getTrajectoryDynamicTarget($info.data);
	        }
	        if ($info.sound) {
	            this.sound = new SkillKeyVo;
	            this.sound.frame = $info.sound.time * Scene_data.frameTime;
	            this.sound.url = $info.sound.name;
	        }
	        if ($info.shock) {
	            this.shockAry = this.getShockAry($info.shock);
	        }
	    }
	    getShockAry($ary) {
	        var keyAry = new Array;
	        for (var i = 0; i < $ary.length; i++) {
	            var key = new SkillShockVo();
	            key.setData($ary[i]);
	            keyAry.push(key);
	        }
	        return keyAry;
	    }
	    getFixEffect($ary) {
	        var keyAry = new Array;
	        for (var i = 0; i < $ary.length; i++) {
	            var key = new SkillFixEffectKeyVo();
	            key.setData($ary[i]);
	            keyAry.push(key);
	        }
	        return keyAry;
	    }
	    getTrajectoryDynamicTarget($ary) {
	        var keyAry = new Array;
	        for (var i = 0; i < $ary.length; i++) {
	            var key = new SkillTrajectoryTargetKeyVo();
	            key.setData($ary[i]);
	            keyAry.push(key);
	        }
	        return keyAry;
	    }
	}
	SkillVo.defaultBloodTime = 250;
	class SkillType {
	}
	SkillType.TrajectoryDynamicTarget = 1;
	SkillType.FixEffect = 4;
	SkillType.TrajectoryDynamicPoint = 3;

	class SkillRes extends BaseRes {
	    constructor() {
	        super();
	        this.meshBatchNum = 1;
	    }
	    load(url, $fun) {
	        this._fun = $fun;
	        LoadManager.getInstance().load(url, LoadManager.BYTE_TYPE, ($byte) => {
	            this.loadComplete($byte);
	        });
	    }
	    loadComplete($byte) {
	        this._byte = new Pan3dByteArray($byte);
	        this._byte.position = 0;
	        this.version = this._byte.readInt();
	        this.skillUrl = this._byte.readUTF();
	        ////console.log("aaaaaaaaaaaaaa " + $byte.byteLength + "," + this._byte.length);
	        this.read(() => { this.readNext(); }); //readimg 
	    }
	    readNext() {
	        this.read(); //readmaterial
	        this.read(); //readparticle;
	        if (this.version < 27) {
	            var str = this._byte.readUTF();
	        }
	        this.data = this.readData(this._byte);
	        this._fun();
	    }
	    readData($byte) {
	        var len = $byte.readInt();
	        var byteData = new Object;
	        for (var i = 0; i < len; i++) {
	            var $obj = new Object;
	            var $name = $byte.readUTF();
	            var $action = $byte.readUTF();
	            $obj.skillname = $name;
	            $obj.action = $action;
	            $obj.type = $byte.readFloat();
	            if (this.version >= 26) {
	                $obj.blood = $byte.readInt();
	                if ($obj.blood == 0) {
	                    $obj.blood = SkillVo.defaultBloodTime;
	                }
	            }
	            else {
	                $obj.blood = SkillVo.defaultBloodTime;
	            }
	            if (this.version >= 32) {
	                var soundTime = $byte.readInt();
	                if (soundTime > 0) {
	                    var soundName = $byte.readUTF();
	                    $obj.sound = { time: soundTime, name: soundName };
	                }
	            }
	            if (this.version >= 33) {
	                var shockLen = $byte.readInt();
	                if (shockLen) {
	                    var shockAry = new Array;
	                    for (var k = 0; k < shockLen; k++) {
	                        var shobj = new Object;
	                        shobj.time = $byte.readInt();
	                        shobj.lasttime = $byte.readInt();
	                        shobj.amp = $byte.readFloat();
	                        shockAry.push(shobj);
	                    }
	                    $obj.shock = shockAry;
	                }
	            }
	            // $obj.data=JSON.parse($byte.readUTF())
	            $obj.data = new Array;
	            var dLen = $byte.readInt();
	            for (var j = 0; j < dLen; j++) {
	                var dataObj = new Object;
	                dataObj.url = $byte.readUTF();
	                dataObj.frame = $byte.readFloat();
	                switch ($obj.type) {
	                    case 1:
	                        dataObj.beginType = $byte.readInt();
	                        if (dataObj.beginType == 0) {
	                            dataObj.beginPos = new Vector3D();
	                            dataObj.beginPos.x = $byte.readFloat();
	                            dataObj.beginPos.y = $byte.readFloat();
	                            dataObj.beginPos.z = $byte.readFloat();
	                        }
	                        else if (dataObj.beginType == 1) {
	                            dataObj.beginSocket = $byte.readUTF();
	                        }
	                        dataObj.hitSocket = $byte.readUTF();
	                        dataObj.endParticle = $byte.readUTF();
	                        dataObj.multype = $byte.readInt();
	                        dataObj.speed = $byte.readFloat();
	                        break;
	                    case 3:
	                        dataObj.beginSocket = $byte.readUTF();
	                        dataObj.beginType = $byte.readFloat();
	                        dataObj.multype = $byte.readFloat();
	                        dataObj.speed = $byte.readFloat();
	                        break;
	                    case 4:
	                        if (this.version >= 27) {
	                            var hasSocket = $byte.readBoolean();
	                            dataObj.hasSocket = hasSocket;
	                            if (hasSocket) {
	                                dataObj.socket = $byte.readUTF();
	                            }
	                            else {
	                                dataObj.pos = this.readV3d($byte);
	                                dataObj.rotation = this.readV3d($byte);
	                            }
	                        }
	                        else {
	                            dataObj.hasSocket = false;
	                            dataObj.pos = this.readV3d($byte);
	                            dataObj.rotation = this.readV3d($byte);
	                        }
	                        break;
	                    default:
	                        alert("没有类型readData");
	                        break;
	                }
	                $obj.data.push(dataObj);
	            }
	            byteData[$name] = $obj;
	        }
	        return byteData;
	    }
	    readV3d($byte) {
	        var v3d = new Vector3D;
	        v3d.x = $byte.readFloat();
	        v3d.y = $byte.readFloat();
	        v3d.z = $byte.readFloat();
	        v3d.w = $byte.readFloat();
	        return v3d;
	    }
	}

	class UnitFunction {
	    static getUItittleUrl(name) {
	        return "ui/load/tittle/" + name + ".png";
	    }
	    static getSkillUrl(name) {
	        if (!name || name.length == 0) ;
	        var str = "skill/" + name + Util.getBaseUrl() + ".txt";
	        return str.replace(".txt", "_byte.txt");
	    }
	    static getModelUrl(name) {
	        return "model/" + name + Util.getBaseUrl() + ".txt";
	    }
	    static getModelUIUrl(name) {
	        return "model/" + name + Util.getBaseUrl() + ".txt";
	    }
	    static getMapUrl(name) {
	        return "map/" + name + ".txt";
	    }
	    /**
	     * 返回角色模型的url
	     * @param name
	     */
	    static getRoleUrl(name) {
	        // if (name.search("2242") != -1) {
	        //     //console.log("2242224222422242")
	        // }
	        // if (name == "0") {
	        //     //console.log("没有这个装备")
	        // }
	        return "role/" + name + Util.getBaseUrl() + ".txt";
	    }
	    static getZipMapUrl(name) {
	        return "map/" + name + "/";
	    }
	    /**标准化数字 */
	    static Snum($num) {
	        return "123";
	    }
	    static getEffectUIUrl(name) {
	        return "ui/load/effect/" + name + ".png";
	    }
	    static getKeyProById($id) {
	        return "cc";
	    }
	}

	class SceneRes extends BaseRes {
	    load($url, $completeFun, $progressFun, $readDataFun) {
	        if (this.sceneData) {
	            if (this.isNeedReload()) {
	                $completeFun();
	                $progressFun(1);
	                this.applyByteArray();
	            }
	            else {
	                $completeFun();
	                $progressFun(1);
	                $readDataFun(this.sceneData);
	            }
	            return;
	        }
	        this._completeFun = $completeFun;
	        this._readDataFun = $readDataFun;
	        this._progressFun = $progressFun;
	        var config = SceneRes.sceneConfigData;
	        //config[$url] = null;
	        if (config && config[$url]) {
	            ////console.log($url)
	            this.loadZipMap($url, config[$url].len);
	        }
	        else {
	            $url = Scene_data.fileRoot + UnitFunction.getMapUrl($url);
	            LoadManager.getInstance().load($url, LoadManager.BYTE_TYPE, ($byte) => {
	                this.loadComplete($byte);
	                //this.unZip($byte);
	            }, null, $progressFun);
	        }
	    }
	    loadZipMap(name, size) {
	        var xhrList = new Array;
	        var aryBufList = new Array;
	        var comNum = 0;
	        var proList = new Array;
	        for (var i = 0; i < size; i++) {
	            proList[i] = 0;
	        }
	        var comFun = ($curxhr) => {
	            var arybuf = $curxhr.response;
	            var idx = xhrList.indexOf($curxhr);
	            aryBufList[idx] = arybuf;
	            comNum++;
	            if (comNum == xhrList.length) { //加载完成
	                var bufSize = 0;
	                for (var i = 0; i < aryBufList.length; i++) {
	                    bufSize += aryBufList[i].byteLength;
	                }
	                var newBuf = new Uint8Array(bufSize);
	                var flag = 0;
	                for (var i = 0; i < aryBufList.length; i++) {
	                    newBuf.set(new Uint8Array(aryBufList[i]), flag);
	                    flag += aryBufList[i].byteLength;
	                }
	                this.loadComplete(newBuf.buffer);
	                //this.unZip(newBuf.buffer);
	            }
	        };
	        var proFun = ($curxhr, num) => {
	            var idx = xhrList.indexOf($curxhr);
	            proList[idx] = num;
	            var allPre = 0;
	            for (var i = 0; i < size; i++) {
	                allPre += proList[i];
	            }
	            allPre = allPre / size;
	            ////console.log("--------地图加载@：",idx,num,allPre);
	            this._progressFun(allPre);
	        };
	        for (var i = 0; i < size; i++) {
	            var xhr = new XMLHttpRequest();
	            xhr.onreadystatechange = (e) => {
	                var curXhr = e.target;
	                if (curXhr.status == 200 && curXhr.readyState == 4) {
	                    comFun(curXhr);
	                }
	            };
	            xhr.onprogress = (e) => {
	                var curXhr = e.target;
	                ////console.log("++++++++地图加载@：",e,e.loaded,e.total);
	                proFun(curXhr, e.loaded / e.total);
	            };
	            var url = Scene_data.fileRoot + UnitFunction.getZipMapUrl(name) + i + ".txt";
	            xhrList.push(xhr);
	            xhr.open("GET", url, true);
	            xhr.responseType = "arraybuffer";
	            xhr.send();
	        }
	    }
	    //private curTime:number = 0;
	    isNeedReload() {
	        var ary = this.sceneData.buildItem;
	        for (var i = 0; i < ary.length; i++) {
	            if (ary[i].type == BaseRes.PREFAB_TYPE && ary[i].lighturl) {
	                var url = Scene_data.fileRoot + ary[i].lighturl;
	                if (TextureManager.getInstance().hasTexture(url)) {
	                    return false;
	                }
	                else {
	                    return true;
	                }
	            }
	        }
	        return ((ResCount.GCTime - this.idleTime) < 10);
	    }
	    loadComplete($byte) {
	        //alert(TimeUtil.getTimer()-this.curTime);
	        this._byte = new Pan3dByteArray($byte);
	        this._completeFun();
	        this.applyByteArray();
	    }
	    applyByteArray() {
	        this._byte.position = 0;
	        this.version = this._byte.readInt();
	        this.read(() => { this.readNext(); }); //img
	    }
	    // public readZipNext():void{
	    //     this.read(() => { this.readNext() });//zipobj
	    // }
	    readNext() {
	        this.read(); //obj
	        this.read(); //material
	        this.read(); //particle;
	        this.readScene();
	        this._readDataFun(this.sceneData);
	    }
	    readScene() {
	        var types = this._byte.readInt();
	        this.readAstat();
	        if (this.version >= 28) {
	            this.readTerrainIdInfoBitmapData(this._byte);
	        }
	        var size = this._byte.readInt();
	        this.sceneData = JSON.parse(this._byte.readUTFBytes(size));
	        this.sceneData.astar = this._astarDataMesh;
	        this.sceneData.terrain = this._terrainDataItem;
	    }
	    readTerrainIdInfoBitmapData($byte) {
	        var $len = $byte.readInt();
	        if ($len) {
	            //var newByte: ByteArray = new ByteArray();
	            //newByte.length = $len;
	            //$byte.readBytes(newByte, 0, $len);
	            var zipLen = $len;
	            var aryBuf = $byte.buffer.slice($byte.position, $byte.position + zipLen);
	            $byte.position += zipLen;
	            var zipedBuf = Util.unZip(aryBuf);
	            var newByte = new Pan3dByteArray(zipedBuf);
	            this._terrainDataItem = GroundDataMesh.meshAllgroundData(newByte);
	        }
	    }
	    readAstat() {
	        var hasAstat = this._byte.readBoolean();
	        if (hasAstat) {
	            this._astarDataMesh = new AstarDataMesh;
	            this._astarDataMesh.aPos = new Vector3D;
	            this._astarDataMesh.astarItem = new Array;
	            this._astarDataMesh.heightItem = new Array;
	            this._astarDataMesh.jumpItem = new Array;
	            this._astarDataMesh.midu = this._byte.readFloat();
	            this._astarDataMesh.aPos.x = this._byte.readFloat();
	            this._astarDataMesh.aPos.y = this._byte.readFloat();
	            this._astarDataMesh.aPos.z = this._byte.readFloat();
	            var i;
	            var j;
	            var tw = this._byte.readInt();
	            var th = this._byte.readInt();
	            this._astarDataMesh.width = tw;
	            this._astarDataMesh.height = th;
	            if (this.version < 25) {
	                for (i = 0; i < th; i++) {
	                    var tempAstar = new Array;
	                    for (j = 0; j < tw; j++) {
	                        tempAstar.push(this._byte.readFloat());
	                    }
	                    this._astarDataMesh.astarItem.push(tempAstar);
	                }
	                for (i = 0; i < th; i++) {
	                    var tempHeightArr = new Array;
	                    for (j = 0; j < tw; j++) {
	                        tempHeightArr.push(this._byte.readFloat());
	                    }
	                    this._astarDataMesh.heightItem.push(tempHeightArr);
	                }
	            }
	            else {
	                var $heightScaleNum = this._byte.readFloat();
	                var $astrBase = this.readAstarFromByte(this._byte);
	                var $jumpBase = this.readAstarFromByte(this._byte);
	                var $astrBaseId = 0;
	                var $jumpBaseId = 0;
	                for (i = 0; i < th; i++) {
	                    var tempAstar = new Array;
	                    var tempJump = new Array;
	                    for (j = 0; j < tw; j++) {
	                        var astarNum = $astrBase[$astrBaseId++];
	                        tempAstar.push(astarNum);
	                        if (astarNum == 1) {
	                            var ssss = $jumpBase[$jumpBaseId++];
	                            tempJump.push(ssss);
	                        }
	                        else {
	                            tempJump.push(0);
	                        }
	                    }
	                    this._astarDataMesh.astarItem.push(tempAstar);
	                    this._astarDataMesh.jumpItem.push(tempJump);
	                }
	                this._astarDataMesh.jumpItem;
	                for (i = 0; i < th; i++) {
	                    var tempHeightArr = new Array;
	                    for (j = 0; j < tw; j++) {
	                        tempHeightArr.push(this._byte.readShort() / $heightScaleNum);
	                    }
	                    this._astarDataMesh.heightItem.push(tempHeightArr);
	                }
	            }
	        }
	    }
	    readAstarFromByte($byte) {
	        var $len = $byte.readUnsignedInt();
	        var $intLen = Math.ceil($len / 32);
	        var $astrBase = new Array;
	        for (var i = 0; i < $intLen; i++) {
	            var $num = $byte.readUnsignedInt();
	            for (var j = 0; j < 32; j++) {
	                var $ast = $num & 1;
	                if ($astrBase.length < $len) {
	                    $astrBase.push($ast);
	                }
	                $num >>= 1;
	            }
	        }
	        return $astrBase;
	    }
	}
	class AstarDataMesh {
	}

	class ResManager extends ResGC {
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new ResManager();
	        }
	        return this._instance;
	    }
	    loadRoleRes(url, $fun, $meshBatchNum) {
	        //if (this._resDic[url]){
	        //    $fun(this._resDic[url]);
	        //    return;
	        //}
	        // if (this._loadDic[url]){
	        //     this._loadDic[url].push($fun);
	        //     return;
	        // }
	        // this._loadDic[url] = new Array;
	        // this._loadDic[url].push($fun);
	        var roleRes = new RoleRes();
	        roleRes.meshBatchNum = $meshBatchNum;
	        roleRes.load(url, () => {
	            $fun(roleRes);
	            // for (var i: number = 0; i < this._loadDic[url].length; i++){
	            //     this._loadDic[url][i](roleRes);
	            // }
	            // delete this._loadDic[url];
	            //this._resDic[url] = roleRes;
	        });
	    }
	    loadSkillRes(url, $fun) {
	        //if (this._resDic[url]) {
	        //    $fun(this._resDic[url]);
	        //    return;
	        //}
	        // if (this._loadDic[url]) {
	        //     this._loadDic[url].push($fun);
	        //     return;
	        // }
	        // this._loadDic[url] = new Array;
	        // this._loadDic[url].push($fun);
	        var skillRes = new SkillRes();
	        skillRes.load(url, () => {
	            $fun(skillRes);
	            // for (var i: number = 0; i < this._loadDic[url].length; i++) {
	            //     this._loadDic[url][i](skillRes);
	            // }
	            // delete this._loadDic[url];
	            //this._resDic[url] = skillRes;
	        });
	    }
	    loadSceneRes($url, $completeFun, $progressFun, $readDataFun) {
	        var sceneRes;
	        //if (this._resDic[$url]) {
	        //    sceneRes = this._resDic[$url];
	        //} else {
	        //    this._resDic[$url] = sceneRes;
	        //}
	        if (this._dic[$url]) {
	            sceneRes = this._dic[$url];
	        }
	        else {
	            sceneRes = new SceneRes();
	            this._dic[$url] = sceneRes;
	        }
	        sceneRes.load($url, $completeFun, $progressFun, $readDataFun);
	        this.clearSceneUse(sceneRes);
	        return sceneRes;
	    }
	    clearSceneUse(curRes) {
	        for (var key in this._dic) {
	            var rc = this._dic[key];
	            if (rc.useNum > 0 && rc != curRes) {
	                rc.useNum = 0;
	            }
	        }
	        curRes.useNum = 1;
	    }
	    gc() {
	        for (var key in this._dic) {
	            var rc = this._dic[key];
	            if (rc.useNum <= 0) {
	                rc.idleTime++;
	                if (rc.idleTime >= ResCount.GCTime) {
	                    //console.log("清理 -" + key);
	                    rc.destory();
	                    delete this._dic[key];
	                }
	            }
	        }
	    }
	}

	class QuadTreeNode {
	    //public pointList: Array<Vector2D>;
	    constructor($x, $y, $z, $width, $height, $depth) {
	        this.x = $x;
	        this.y = $y;
	        this.z = $z;
	        this.width = $width;
	        this.height = $height;
	        this.depth = $depth;
	        //this.pointList = new Array;
	        //this.pointList.push(new Vector2D(this.x, this.y));
	        //this.pointList.push(new Vector2D(this.x + this.width, this.y));
	        //this.pointList.push(new Vector2D(this.x + this.width, this.y + this.height));
	        //this.pointList.push(new Vector2D(this.x, this.y + this.height));
	    }
	    testViewFrustum(face, ray) {
	        if (this.sun && this.sun.length == 1) {
	            this.sun[0].testViewFrustum(face, ray);
	            return;
	        }
	        if (this.testViewFrustumResult(face)) {
	            if (this.target) {
	                if (this.target.isPerspective) {
	                    if (!this.testRay(ray)) {
	                        this.target.sceneVisible = true;
	                    }
	                }
	                else {
	                    this.target.sceneVisible = true;
	                }
	            }
	            if (this.sun) {
	                for (var i = 0; i < this.sun.length; i++) {
	                    this.sun[i].testViewFrustum(face, ray);
	                }
	            }
	        }
	    }
	    testViewFrustumResult(face) {
	        var pos = new Vector3D(this.x, this.y, this.z);
	        var whd = new Vector3D(this.width, this.height, this.depth);
	        var bInSide = true;
	        for (var j = 0; j < face.length; j++) {
	            var vcMin = pos;
	            var vcMax = pos.add(whd);
	            var _vcMax = new Vector3D();
	            // var _vcMin: Vector3D = new Vector3D();
	            if (face[j].x > 0) {
	                _vcMax.x = vcMax.x;
	                //_vcMin.x = vcMin.x;
	            }
	            else {
	                //_vcMin.x = vcMax.x;
	                _vcMax.x = vcMin.x;
	            }
	            if (face[j].y > 0) {
	                _vcMax.y = vcMax.y;
	                //_vcMin.y = vcMin.y;
	            }
	            else {
	                //_vcMin.y = vcMax.y;
	                _vcMax.y = vcMin.y;
	            }
	            if (face[j].z > 0) {
	                _vcMax.z = vcMax.z;
	                //_vcMin.z = vcMin.z;
	            }
	            else {
	                //_vcMin.z = vcMax.z;
	                _vcMax.z = vcMin.z;
	            }
	            var num = face[j].dot(_vcMax) + face[j].w;
	            if (num < 0) {
	                bInSide = false;
	                break;
	            }
	        }
	        return bInSide;
	    }
	    testRay(ray) {
	        var ox = ray.o.x;
	        var oy = ray.o.y;
	        var oz = ray.o.z;
	        var dx = ray.d.x;
	        var dy = ray.d.y;
	        var dz = ray.d.z;
	        var tx_min, ty_min, tz_min;
	        var tx_max, ty_max, tz_max;
	        var x0 = this.x;
	        var y0 = this.y;
	        var z0 = this.z;
	        var x1 = this.x + this.width;
	        var y1 = this.y + this.height;
	        var z1 = this.z + this.depth;
	        var a = 1.0 / dx;
	        if (a >= 0) {
	            tx_min = (x0 - ox) * a;
	            tx_max = (x1 - ox) * a;
	        }
	        else {
	            tx_min = (x1 - ox) * a;
	            tx_max = (x0 - ox) * a;
	        }
	        var b = 1.0 / dy;
	        if (b >= 0) {
	            ty_min = (y0 - oy) * b;
	            ty_max = (y1 - oy) * b;
	        }
	        else {
	            ty_min = (y1 - oy) * b;
	            ty_max = (y0 - oy) * b;
	        }
	        var c = 1.0 / dz;
	        if (c >= 0) {
	            tz_min = (z0 - oz) * c;
	            tz_max = (z1 - oz) * c;
	        }
	        else {
	            tz_min = (z1 - oz) * c;
	            tz_max = (z0 - oz) * c;
	        }
	        var t0, t1;
	        // find largest entering t value
	        if (tx_min > ty_min)
	            t0 = tx_min;
	        else
	            t0 = ty_min;
	        if (tz_min > t0)
	            t0 = tz_min;
	        // find smallest exiting t value
	        if (tx_max < ty_max)
	            t1 = tx_max;
	        else
	            t1 = ty_max;
	        if (tz_max < t1)
	            t1 = tz_max;
	        var kEpsilon = 0.0001;
	        var tmin = 0;
	        if (t0 < t1 && t1 > kEpsilon) { // condition for a hit
	            if (t0 > kEpsilon) {
	                tmin = t0; // ray hits outside surface
	            }
	            else {
	                tmin = t1; // ray hits inside surface
	            }
	            if (tmin < ray.baseT) {
	                return true;
	            }
	        }
	        else
	            return false;
	    }
	}
	class Ray {
	    constructor() {
	        this.o = new Vector3D;
	        this.d = new Vector3D;
	        this.baseT = 500;
	    }
	    setPos(x, y, z) {
	        this.o.x = x;
	        this.o.y = y;
	        this.o.z = z;
	    }
	    setTarget(x, y, z) {
	        this.d.x = x - this.o.x;
	        this.d.y = y - this.o.y;
	        this.d.z = z - this.o.z;
	        this.d.normalize();
	    }
	}

	class Circle {
	    constructor($x = 0, $y = 0, $radius = 0) {
	        this.setData($x, $y, $radius);
	    }
	    setData($x, $y, $radius) {
	        this.x = $x;
	        this.y = $y;
	        this.radius = $radius;
	    }
	    setPos($x, $y) {
	        this.x = $x;
	        this.y = $y;
	    }
	    set x(value) {
	        this._x = value;
	    }
	    get x() {
	        return this._x;
	    }
	    set y(value) {
	        this._y = value;
	    }
	    get y() {
	        return this._y;
	    }
	    setRadius($radius) {
	        this.radius = $radius;
	    }
	    testPoint($point) {
	        var xx = this.x - $point.x;
	        var yy = this.y - $point.y;
	        return Math.sqrt(xx * xx + yy * yy) < this.radius;
	    }
	}

	class MathClass {
	    constructor() {
	    }
	    static getCamView(_Cam, _focus_3d) {
	        //var $dis: number = 1000;
	        // _Cam.update();
	        //计算出相机的位置
	        var $m = new Matrix3D;
	        $m.appendRotation(-_focus_3d.rotationX, Vector3D.X_AXIS);
	        $m.appendTranslation(_focus_3d.x, _focus_3d.y, _focus_3d.z);
	        var $p = $m.transformVector(new Vector3D(0, 0, -_Cam.distance));
	        _Cam.x = $p.x;
	        _Cam.y = $p.y;
	        _Cam.z = $p.z;
	        _Cam.rotationX = _focus_3d.rotationX;
	        //重置相机矩阵
	        _Cam.cameraMatrix.identity();
	        _Cam.cameraMatrix.prependTranslation(0, 0, _Cam.distance);
	        _Cam.cameraMatrix.prependRotation(_Cam.rotationX, Vector3D.X_AXIS);
	        _Cam.cameraMatrix.prependTranslation(-_focus_3d.x, -_focus_3d.y, -_focus_3d.z);
	        _Cam.cameraMatrix.setClipPlan(999, 1);
	        this.updateVp();
	        return _Cam.cameraMatrix.m;
	    }
	    static updateVp() {
	        Scene_data.vpMatrix.identity();
	        Scene_data.vpMatrix.prepend(Scene_data.viewMatrx3D);
	        Scene_data.vpMatrix.prepend(Scene_data.cam3D.cameraMatrix);
	    }
	    static GetViewHitBoxDataCopy($dis) {
	        if (!this.viewBoxVecItem) {
	            this.viewBoxVecItem = new Array;
	            this.viewBoxVecItem.push(new Vector3D());
	            this.viewBoxVecItem.push(new Vector3D());
	            this.viewBoxVecItem.push(new Vector3D());
	            this.viewBoxVecItem.push(new Vector3D());
	        }
	        var $disNum = $dis / (Scene_data.sceneViewHW / 2);
	        var $far = Scene_data.sceneViewHW / 2 * $disNum;
	        var fovw = Scene_data.stageWidth;
	        var fovh = Scene_data.stageHeight;
	        var m = new Matrix3D;
	        m.prependRotation(-Scene_data.cam3D.rotationY, Vector3D.Y_AXIS);
	        m.prependRotation(-Scene_data.cam3D.rotationX, Vector3D.X_AXIS);
	        var uc = Scene_data.viewMatrx3D.transformVector(new Vector3D(500, 0, 500));
	        var zScale = uc.x / uc.w;
	        var ss = 0.8;
	        var fw = (fovw / 2 / zScale) * $disNum * ss;
	        var fh = (fovh / 2 / zScale) * $disNum * ss;
	        this.viewBoxVecItem[0] = this.gettempPos(new Vector3D(-fw, -fh, $far), m);
	        this.viewBoxVecItem[1] = this.gettempPos(new Vector3D(+fw, -fh, $far), m);
	        this.viewBoxVecItem[2] = this.gettempPos(new Vector3D(+fw, +fh, $far), m);
	        this.viewBoxVecItem[3] = this.gettempPos(new Vector3D(-fw, +fh, $far), m);
	    }
	    static gettempPos(a, m) {
	        var b = m.transformVector(a);
	        b = b.add(new Vector3D(Scene_data.cam3D.x, Scene_data.cam3D.y, Scene_data.cam3D.z));
	        return b;
	    }
	    static math_distance(x1, y1, x2, y2) {
	        return Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
	    }
	}

	class LineDisplayShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "v3Color");
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec3 v3Position;" +
	            "attribute vec3 v3Color;" +
	            "uniform mat4 viewMatrix3D;" +
	            "uniform mat4 camMatrix3D;" +
	            "uniform mat4 posMatrix3D;" +
	            "varying vec4 colorData;" +
	            "void main(void)" +
	            "{" +
	            "   vec4 vt0= vec4(v3Position, 1.0);" +
	            "   colorData =vec4(v3Color,1) ;" +
	            "   vt0 = posMatrix3D * vt0;" +
	            "   vt0 = camMatrix3D * vt0;" +
	            "   vt0 = viewMatrix3D * vt0;" +
	            "   gl_Position = vt0;" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = " precision mediump float;\n" +
	            "varying vec4 colorData;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "gl_FragColor =colorData;\n" +
	            "}";
	        return $str;
	    }
	}
	LineDisplayShader.LineShader = "LineShader";

	class LineDisplaySprite extends Display3D {
	    constructor() {
	        super();
	        this.baseColor = new Vector3D(1, 0, 0);
	        this.objData = new ObjData;
	        this.shader = ProgramManager.getInstance().getProgram(LineDisplayShader.LineShader);
	        this.program = this.shader.program;
	        this.makeLineMode(new Vector3D(0, 0, 0), new Vector3D(100, 0, 0), new Vector3D());
	        this.makeLineMode(new Vector3D(0, 0, 0), new Vector3D(100, 0, 100), new Vector3D());
	        this.makeLineMode(new Vector3D(100, 0, 0), new Vector3D(100, 0, 100), new Vector3D());
	        this.upToGpu();
	    }
	    makeLineMode(a, b, $color = null) {
	        if (!this.lineVecPos || !this.lineIndex) {
	            this.clear();
	        }
	        if ($color) {
	            this.baseColor = $color;
	        }
	        this.lineVecPos.push(a.x, a.y, a.z);
	        this.lineVecPos.push(b.x, b.y, b.z);
	        this.lineColor.push(this.baseColor.x, this.baseColor.y, this.baseColor.z);
	        this.lineColor.push(this.baseColor.x, this.baseColor.y, this.baseColor.z);
	        this.lineIndex.push(this.lineIndex.length + 0, this.lineIndex.length + 1);
	    }
	    clear() {
	        this.lineVecPos = new Array;
	        this.lineIndex = new Array;
	        this.lineColor = new Array;
	        if (this.objData.indexBuffer) {
	            this.objData.indexBuffer = null;
	        }
	    }
	    upToGpu() {
	        if (this.lineIndex.length) {
	            //console.log("A星长度", this.lineIndex.length)
	            this.objData.treNum = this.lineIndex.length;
	            this.objData.vertexBuffer = Scene_data.context3D.uploadBuff3D(this.lineVecPos);
	            this.objData.normalsBuffer = Scene_data.context3D.uploadBuff3D(this.lineColor);
	            this.objData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(this.lineIndex);
	        }
	    }
	    update() {
	        if (this.objData && this.objData.indexBuffer) {
	            Scene_data.context3D.setProgram(this.program);
	            Scene_data.context3D.setVcMatrix4fv(this.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	            Scene_data.context3D.setVcMatrix4fv(this.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	            Scene_data.context3D.setVcMatrix4fv(this.shader, "posMatrix3D", this.posMatrix.m);
	            Scene_data.context3D.setVa(0, 3, this.objData.vertexBuffer);
	            Scene_data.context3D.setVa(1, 3, this.objData.normalsBuffer);
	            Scene_data.context3D.drawLine(this.objData.indexBuffer, this.objData.treNum);
	        }
	    }
	}

	class SceneQuadTree {
	    constructor() {
	        this.needUpdata = false;
	        this.panleAry = new Array;
	    }
	    init(obj, $dic) {
	        this._circle = new Circle(10000, 10000);
	        this._sceneDic = $dic;
	        this._rootNode = this.getNode(obj);
	        this._ray = new Ray;
	    }
	    getNode(obj) {
	        var quadNode = new QuadTreeNode(obj.x, obj.y, obj.z, obj.width, obj.height, obj.depth);
	        if (obj.data) {
	            if (!quadNode.sun) {
	                quadNode.sun = new Array;
	            }
	            for (var i = 0; i < obj.data.length; i++) {
	                var dataNode = new QuadTreeNode(obj.data[i].x, obj.data[i].y, obj.data[i].z, obj.data[i].width, obj.data[i].height, obj.data[i].depth);
	                var key;
	                if (obj.data[i].type == 1) {
	                    key = "build" + obj.data[i].id;
	                }
	                else if (obj.data[i].type == 11) {
	                    key = "particle" + obj.data[i].id;
	                }
	                else if (obj.data[i].type == 14) {
	                    key = "ground" + obj.data[i].id;
	                }
	                dataNode.target = this._sceneDic[key];
	                dataNode.target.aabb = dataNode;
	                quadNode.sun.push(dataNode);
	            }
	        }
	        if (obj.sun) {
	            if (!quadNode.sun) {
	                quadNode.sun = new Array;
	            }
	            for (var i = 0; i < obj.sun.length; i++) {
	                quadNode.sun.push(this.getNode(obj.sun[i]));
	            }
	        }
	        return quadNode;
	    }
	    setCircle($x, $z, $radius) {
	        var xx = $x - this._circle.x;
	        var yy = $z - this._circle.y;
	        if (Math.sqrt(xx * xx + yy * yy) < 10) {
	            this.needUpdata = false;
	        }
	        else {
	            this._circle.setData($x, $z, $radius);
	            this.needUpdata = true;
	        }
	    }
	    update() {
	        MathClass.GetViewHitBoxDataCopy(Scene_data.cam3D.distance);
	        var cam = new Vector3D(Scene_data.cam3D.x, Scene_data.cam3D.y, Scene_data.cam3D.z);
	        var vc = MathClass.viewBoxVecItem;
	        this.panleAry.length = 0;
	        this.panleAry.push(this.getPanelByVec(cam, vc[0], vc[1]));
	        this.panleAry.push(this.getPanelByVec(cam, vc[1], vc[2]));
	        this.panleAry.push(this.getPanelByVec(cam, vc[2], vc[3]));
	        this.panleAry.push(this.getPanelByVec(cam, vc[3], vc[0]));
	        //this.panleAry.push(this.getPanelByVec(vc[0], vc[1], vc[2]));
	        //this._rootNode.testCircle(this._circle);
	        //this._rootNode.testCam();
	        this._ray.setPos(Scene_data.cam3D.x, Scene_data.cam3D.y, Scene_data.cam3D.z);
	        this._ray.setTarget(Scene_data.focus3D.x, Scene_data.focus3D.y, Scene_data.focus3D.z);
	        this._ray.baseT = Scene_data.cam3D.distance;
	        this._rootNode.testViewFrustum(this.panleAry, this._ray);
	    }
	    getPanelByVec(v1, v2, v3) {
	        var a1 = v2.subtract(v1);
	        var a2 = v3.subtract(v1);
	        a1 = a1.cross(a2);
	        a1.normalize();
	        a1.w = -a1.dot(v1);
	        return a1;
	    }
	    updateDraw() {
	        if (this.capsuleLineSprite) {
	            this.capsuleLineSprite.x = Scene_data.focus3D.x;
	            this.capsuleLineSprite.y = Scene_data.focus3D.y + 50;
	            this.capsuleLineSprite.z = Scene_data.focus3D.z;
	            this.capsuleLineSprite.update();
	        }
	        else {
	            this.capsuleLineSprite = new LineDisplaySprite();
	            this.capsuleLineSprite.clear();
	            this.capsuleLineSprite.baseColor = new Vector3D(1, 0, 0, 1);
	            this.drawCylinder(this._circle.radius, 10);
	            this.capsuleLineSprite.upToGpu();
	        }
	    }
	    drawCylinder($w, $h) {
	        var w = $w;
	        var h = $h;
	        var jindu = 12;
	        var lastA;
	        var lastB;
	        var i;
	        for (i = 0; i < jindu; i++) {
	            var a = new Vector3D(w, 0, 0);
	            var b = new Vector3D(w, +h, 0);
	            var m = new Matrix3D;
	            m.appendRotation(i * (360 / jindu), Vector3D.Y_AXIS);
	            var A = m.transformVector(a);
	            var B = m.transformVector(b);
	            this.capsuleLineSprite.makeLineMode(A, B);
	            //this.capsuleLineSprite.makeLineMode(A, new Vector3D(0, 0, 0))
	            this.capsuleLineSprite.makeLineMode(B, new Vector3D(0, +h, 0));
	            if (i == (jindu - 1)) {
	                this.capsuleLineSprite.makeLineMode(A, a);
	                this.capsuleLineSprite.makeLineMode(B, b);
	            }
	            if (lastA || lastB) {
	                this.capsuleLineSprite.makeLineMode(A, lastA);
	                this.capsuleLineSprite.makeLineMode(B, lastB);
	            }
	            lastA = A.clone();
	            lastB = B.clone();
	        }
	    }
	}

	class ViewFrustum {
	    constructor() {
	    }
	    init() {
	        this.capsuleLineSprite = new LineDisplaySprite();
	        SceneManager.getInstance().addDisplay(this.capsuleLineSprite);
	    }
	    setCam() {
	        var m = Scene_data.cam3D.cameraMatrix.clone();
	        m.append(Scene_data.viewMatrx3D);
	        var a = m.m;
	        var a11 = a[0], a12 = a[1], a13 = a[2], a14 = a[3], a21 = a[4], a22 = a[5], a23 = a[6], a24 = a[7], a31 = a[8], a32 = a[9], a33 = a[10], a34 = a[11], a41 = a[12], a42 = a[13], a43 = a[14], a44 = a[15];
	        this.panleAry = new Array;
	        var farp = this.getPanle(-a31 + a41, -a32 + a42, -a33 + a43, -a34 + a44);
	        var bottom = this.getPanle(a21 + a41, a22 + a42, a23 + a43, a24 + a44);
	        var top = this.getPanle(-a21 + a41, -a22 + a42, -a23 + a43, -a24 + a44);
	        var left = this.getPanle(a11 + a41, a12 + a42, a13 + a43, a14 + a44);
	        var right = this.getPanle(-a11 + a41, -a12 + a42, -a13 + a43, -a14 + a44);
	        //this.panleAry.push(top,right,bottom,left);
	        ////console.log("------------");
	        //for (var i: number = 0; i < this.panleAry.length; i++){
	        //    var p: Vector3D = this.panleAry[i];
	        //    //p.normalize();
	        //    var num: number = p.x * Scene_data.cam3D.x + p.y * Scene_data.cam3D.y + p.z * Scene_data.cam3D.z;
	        //    num = num - p.w;
	        //    //console.log(num); 
	        //}
	    }
	    getPanle(a, b, c, d) {
	        var normal = new Vector3D(a, b, c, d);
	        normal.normalize();
	        return normal;
	    }
	    getPanelByVec(v1, v2, v3) {
	        var a1 = v2.subtract(v1);
	        var a2 = v3.subtract(v1);
	        a1 = a1.cross(a2);
	        a1.normalize();
	        a1.w = -a1.dot(v1);
	        return a1;
	    }
	    setData(obj) {
	        this.dataAry = obj;
	    }
	    setViewFrustum() {
	        if (!this.capsuleLineSprite) {
	            this.init();
	        }
	        this.setCam();
	        this.capsuleLineSprite.clear();
	        this.capsuleLineSprite.baseColor = new Vector3D(0, 0, 1, 1);
	        MathClass.GetViewHitBoxDataCopy(Scene_data.cam3D.distance);
	        var cam = new Vector3D(Scene_data.cam3D.x, Scene_data.cam3D.y, Scene_data.cam3D.z);
	        var vc = MathClass.viewBoxVecItem;
	        this.panleAry.push(this.getPanelByVec(cam, vc[0], vc[1]));
	        this.panleAry.push(this.getPanelByVec(cam, vc[1], vc[2]));
	        this.panleAry.push(this.getPanelByVec(cam, vc[2], vc[3]));
	        this.panleAry.push(this.getPanelByVec(cam, vc[3], vc[0]));
	        /*
	        for (var i: number = 0; i < vc.length; i++){
	            this.capsuleLineSprite.makeLineMode(cam, vc[i]);
	        }
	        */
	        for (var i = 0; i < this.dataAry.length; i++) {
	            var obj = this.dataAry[i];
	            var pos = new Vector3D(obj.x, obj.y, obj.z);
	            var whd = new Vector3D(obj.width, obj.height, obj.depth);
	            var bOutSide = false;
	            for (var j = 0; j < this.panleAry.length; j++) {
	                var vcMin = pos;
	                var vcMax = pos.add(whd);
	                var _vcMax = new Vector3D();
	                // var _vcMin: Vector3D = new Vector3D();
	                if (this.panleAry[j].x > 0) {
	                    _vcMax.x = vcMax.x;
	                    //_vcMin.x = vcMin.x;
	                }
	                else {
	                    //_vcMin.x = vcMax.x;
	                    _vcMax.x = vcMin.x;
	                }
	                if (this.panleAry[j].y > 0) {
	                    _vcMax.y = vcMax.y;
	                    //_vcMin.y = vcMin.y;
	                }
	                else {
	                    //_vcMin.y = vcMax.y;
	                    _vcMax.y = vcMin.y;
	                }
	                if (this.panleAry[j].z > 0) {
	                    _vcMax.z = vcMax.z;
	                    //_vcMin.z = vcMin.z;
	                }
	                else {
	                    //_vcMin.z = vcMax.z;
	                    _vcMax.z = vcMin.z;
	                }
	                var num = this.panleAry[j].dot(_vcMax) + this.panleAry[j].w;
	                if (num < 0) {
	                    bOutSide = true;
	                    break;
	                }
	            }
	            if (bOutSide) {
	                this.capsuleLineSprite.baseColor = new Vector3D(1, 0, 0, 1);
	            }
	            else {
	                this.capsuleLineSprite.baseColor = new Vector3D(0, 0, 1, 1);
	            }
	            this.capsuleLineSprite.makeLineMode(pos, new Vector3D(pos.x + whd.x, pos.y, pos.z));
	            this.capsuleLineSprite.makeLineMode(pos, new Vector3D(pos.x, pos.y, pos.z + whd.z));
	            this.capsuleLineSprite.makeLineMode(new Vector3D(pos.x + whd.x, pos.y, pos.z), new Vector3D(pos.x + whd.x, pos.y, pos.z + whd.z));
	            this.capsuleLineSprite.makeLineMode(new Vector3D(pos.x, pos.y, pos.z + whd.z), new Vector3D(pos.x + whd.x, pos.y, pos.z + whd.z));
	            this.capsuleLineSprite.makeLineMode(new Vector3D(pos.x, pos.y + whd.y, pos.z), new Vector3D(pos.x + whd.x, pos.y + whd.y, pos.z));
	            this.capsuleLineSprite.makeLineMode(new Vector3D(pos.x, pos.y + whd.y, pos.z), new Vector3D(pos.x, pos.y + whd.y, pos.z + whd.z));
	            this.capsuleLineSprite.makeLineMode(new Vector3D(pos.x + whd.x, pos.y + whd.y, pos.z), new Vector3D(pos.x + whd.x, pos.y + whd.y, pos.z + whd.z));
	            this.capsuleLineSprite.makeLineMode(new Vector3D(pos.x, pos.y + whd.y, pos.z + whd.z), new Vector3D(pos.x + whd.x, pos.y + whd.y, pos.z + whd.z));
	            this.capsuleLineSprite.makeLineMode(new Vector3D(pos.x, pos.y, pos.z), new Vector3D(pos.x, pos.y + whd.y, pos.z));
	            this.capsuleLineSprite.makeLineMode(new Vector3D(pos.x + whd.x, pos.y, pos.z), new Vector3D(pos.x + whd.x, pos.y + whd.y, pos.z));
	            this.capsuleLineSprite.makeLineMode(new Vector3D(pos.x, pos.y, pos.z + whd.z), new Vector3D(pos.x, pos.y + whd.y, pos.z + whd.z));
	            this.capsuleLineSprite.makeLineMode(new Vector3D(pos.x + whd.x, pos.y, pos.z + whd.z), new Vector3D(pos.x + whd.x, pos.y + whd.y, pos.z + whd.z));
	        }
	        this.capsuleLineSprite.upToGpu();
	    }
	}

	class ObjectMath {
	    constructor() {
	        this.a = 0;
	        this.b = 0;
	        this.c = 0;
	        this.d = 0;
	    }
	}
	class Calculation {
	    constructor() {
	    }
	    static _PanelEquationFromThreePt(p1, p2, p3) {
	        //得到平面方程 ax+by+cz+d=0(传入三个点,返回平面方程a,b,c,d);
	        var a = ((p2.y - p1.y) * (p3.z - p1.z) - (p2.z - p1.z) * (p3.y - p1.y));
	        var b = ((p2.z - p1.z) * (p3.x - p1.x) - (p2.x - p1.x) * (p3.z - p1.z));
	        var c = ((p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x));
	        var d = (0 - (a * p1.x + b * p1.y + c * p1.z));
	        var tempObjectMath = new ObjectMath;
	        tempObjectMath.a = a;
	        tempObjectMath.b = b;
	        tempObjectMath.c = c;
	        tempObjectMath.d = d;
	        return tempObjectMath;
	    }
	    static calPlaneLineIntersectPoint(planeVector, planePoint, linePointA, linePointB) {
	        var ret = new Vector3D();
	        var vp1 = planeVector.x;
	        var vp2 = planeVector.y;
	        var vp3 = planeVector.z;
	        var n1 = planePoint.x;
	        var n2 = planePoint.y;
	        var n3 = planePoint.z;
	        var v1 = linePointA.x - linePointB.x;
	        var v2 = linePointA.y - linePointB.y;
	        var v3 = linePointA.z - linePointB.z;
	        var m1 = linePointB.x;
	        var m2 = linePointB.y;
	        var m3 = linePointB.z;
	        var vpt = v1 * vp1 + v2 * vp2 + v3 * vp3;
	        //首先判断直线是否与平面平行
	        if (vpt == 0) {
	            return null;
	        }
	        else {
	            var t = ((n1 - m1) * vp1 + (n2 - m2) * vp2 + (n3 - m3) * vp3) / vpt;
	            ret.x = m1 + v1 * t;
	            ret.y = m2 + v2 * t;
	            ret.z = m3 + v3 * t;
	        }
	        return ret;
	    }
	}

	class MathUtil {
	    /**
	     * 2D坐标转换成3D坐标，当然要给一个相离镜头的深度
	     * @param $point  2d位置是场景的坐标，
	     * @param $depht  默认深度为500,
	     * @return  3D的坐标
	     *
	     */
	    static mathDisplay2Dto3DWorldPos($point, $depht = 300) {
	        var $disNum = $depht / (Scene_data.sceneViewHW / 2);
	        var $far = Scene_data.sceneViewHW / 2 * $disNum;
	        var fovw = Scene_data.stageWidth;
	        var fovh = Scene_data.stageHeight;
	        var m = new Matrix3D;
	        m.prependRotation(-Scene_data.cam3D.rotationY, Vector3D.Y_AXIS);
	        m.prependRotation(-Scene_data.cam3D.rotationX, Vector3D.X_AXIS);
	        var uc = Scene_data.viewMatrx3D.transformVector(new Vector3D(500, 0, 500));
	        var zScale = uc.x / uc.w;
	        var fw = (fovw / 2 / zScale) * $disNum;
	        var fh = (fovh / 2 / zScale) * $disNum;
	        var tx = (($point.x / fovw) * fw) * 2;
	        var ty = (($point.y / fovh) * fh) * 2;
	        var p = this.gettempPos(new Vector3D(-fw + tx, +fh - ty, $far), m);
	        return p;
	    }
	    static gettempPos(a, m) {
	        var b = m.transformVector(a);
	        b = b.add(new Vector3D(Scene_data.cam3D.x, Scene_data.cam3D.y, Scene_data.cam3D.z));
	        return b;
	    }
	    //3d坐标转换成场景像素坐标
	    static math3DWorldtoDisplay2DPos($pos) {
	        var m = Scene_data.cam3D.cameraMatrix.clone();
	        m.append(Scene_data.viewMatrx3D.clone());
	        var fovw = Scene_data.stageWidth;
	        var fovh = Scene_data.stageHeight;
	        var p = m.transformVector($pos);
	        var b = new Vector2D;
	        b.x = ((p.x / p.w) + 1) * (fovw / 2);
	        b.y = ((-p.y / p.w) + 1) * (fovh / 2);
	        return b;
	    }
	    static argbToHex(a, r, g, b) {
	        // 转换颜色
	        var color = a << 24 | r << 16 | g << 8 | b;
	        return color;
	    }
	    static hexToArgb(expColor) {
	        var color = new Vector3D();
	        color.w = (expColor >> 24) & 0xFF;
	        color.x = (expColor >> 16) & 0xFF;
	        color.y = (expColor >> 8) & 0xFF;
	        color.z = (expColor) & 0xFF;
	        return color;
	    }
	    /**
	     * 空间一条射线和平面的交点
	     * @param linePoint_a  过直线的一点
	     * @param linePoint_b  过直线另一点
	     * @param planePoint   过平面一点
	     * @param planeNormal  平面的法线
	     * @return
	     *
	     */
	    static getLineAndPlaneIntersectPoint(linePoint_a, linePoint_b, planePoint, planeNormal) {
	        var lineVector = new Vector3D(linePoint_a.x - linePoint_b.x, linePoint_a.y - linePoint_b.y, linePoint_a.z - linePoint_b.z);
	        lineVector.normalize();
	        var pt = lineVector.x * planeNormal.x + lineVector.y * planeNormal.y + lineVector.z * planeNormal.z;
	        var t = ((planePoint.x - linePoint_a.x) * planeNormal.x + (planePoint.y - linePoint_a.y) * planeNormal.y + (planePoint.z - linePoint_a.z) * planeNormal.z) / pt;
	        var aPro1 = new Vector3D;
	        aPro1.setTo(linePoint_a.x + lineVector.x * t, linePoint_a.y + lineVector.y * t, linePoint_a.z + lineVector.z * t);
	        return aPro1;
	    }
	    static lookAt(eyePos, lookAt) {
	        var matr = new Matrix3D();
	        matr.buildLookAtLH(eyePos, lookAt, Vector3D.Y_AXIS);
	        return matr;
	    }
	    /**
	     *  功能:根据两个点返回角度
	     *  参数:
	     **/
	    static getTowPointsAngle2(x1, y1, x2, y2) {
	        var radian = Math.atan2(y2 - y1, x2 - x1);
	        if (radian < 0)
	            radian += Math.PI * 2;
	        return (radian * 180 / Math.PI) | 0;
	    }
	    /**
	     * 返回两点的夹角
	     * @param $p0
	     * @param $p1
	     * @return
	     */
	    static getTowPointsAngle($p0, $p1) {
	        var radian = Math.atan2($p1.y - $p0.y, $p1.x - $p0.x);
	        if (radian < 0)
	            radian += 2 * Math.PI;
	        return radian * 180 / Math.PI;
	    }
	    /** 返回两个点的距离
	     *  **/
	    static getDisSquare(x1, y1, x2, y2) {
	        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
	    }
	}

	class Groundposition {
	    constructor() {
	    }
	    static getGroundPos($x, $y) {
	        var $ty = -500;
	        if (!this._plantObjectMath) {
	            var A = new Vector3D(0, $ty, 500);
	            var B = new Vector3D(-500, $ty, 0);
	            var C = new Vector3D(500, $ty, 0);
	            this._plantObjectMath = Calculation._PanelEquationFromThreePt(A, B, C);
	            this._plantnormal = new Vector3D(this._plantObjectMath.a, this._plantObjectMath.b, this._plantObjectMath.c);
	            this._plantnormal.normalize();
	            this._plane_a = new Vector3D(A.x, A.y, A.z);
	        }
	        //计算直线与平面交点
	        var line_a = MathUtil.mathDisplay2Dto3DWorldPos(new Vector2D($x, $y), 500);
	        var line_b = new Vector3D(Scene_data.cam3D.x, Scene_data.cam3D.y, Scene_data.cam3D.z);
	        var crossPoint = Calculation.calPlaneLineIntersectPoint(this._plantnormal, this._plane_a, line_a, line_b);
	        return crossPoint;
	    }
	}

	class AstarUtil {
	    constructor() {
	    }
	    static setData($tempNavMesh) {
	        this.navmeshData = $tempNavMesh;
	        this.heightItem = this.navmeshData.heightItem;
	        this.jumpItem = this.navmeshData.jumpItem;
	        this.midu = this.navmeshData.midu;
	        this.aPos = new Vector3D(this.navmeshData.aPos.x, this.navmeshData.aPos.y, this.navmeshData.aPos.z);
	        this.makeStarGraph(this.navmeshData.astarItem);
	        this.astarWidth = this.heightItem[0].length;
	        this.astarHeight = this.heightItem.length;
	        SceneManager.getInstance().fixAstart(new Vector2D(this.aPos.x, this.midu * this.astarHeight + this.aPos.z));
	        this.mathAreaRect();
	        this.mathMinMapRect();
	    }
	    static set sceneVectList(value) {
	        this._sceneVectList = value;
	        this._frist = true; //标记新进入场景时
	    }
	    /*
	    public static sceneRotationInfo(): void {
	        
	        if (!this.navmeshData) {
	            return;
	        }
	        if (this._sceneVectList) {
	            var $focus2D: Vector2D = AstarUtil.getGrapIndexByPos(new Vector3D(Scene_data.focus3D.x, Scene_data.focus3D.y, Scene_data.focus3D.z))
	            for (var i: number = 0; i < this._sceneVectList.length; i++) {
	                var $pos: Vector2D = new Vector2D(this._sceneVectList[i].x, this._sceneVectList[i].y)
	                var $dis: number = Vector2D.distance($pos, $focus2D);
	                this._sceneVectList[i].z = $dis;
	            }
	            this._sceneVectList.sort(
	                function (a: Vector3D, b: Vector3D): number {
	                    return a.z - b.z;
	                }
	            )
	            var disA: number = Vector2D.distance(new Vector2D(this._sceneVectList[0].x, this._sceneVectList[0].y), $focus2D);
	            var disB: number = Vector2D.distance(new Vector2D(this._sceneVectList[1].x, this._sceneVectList[1].y), $focus2D);
	            var $kangly: number = disA / (disA + disB) * this._sceneVectList[1].w + disB / (disA + disB) * this._sceneVectList[0].w
	            if (this._frist) {
	                this._frist = false
	                Scene_data.focus3D.rotationY = Scene_data.gameAngle + $kangly;
	            } else {
	                Scene_data.focus3D.rotationY += ((Scene_data.gameAngle + $kangly) - Scene_data.focus3D.rotationY) / 100;
	            }
	        } else {
	            Scene_data.focus3D.rotationY = Scene_data.gameAngle;
	        }
	 
	    }
	    */
	    static getJumpDataByV2d($tx, $ty) {
	        if (this.jumpItem && this.jumpItem.length) {
	            if (this.jumpItem[$ty] && this.jumpItem[$ty][$tx] == 1) {
	                return true;
	            }
	        }
	        return false;
	    }
	    static mathMinMapRect() {
	        var midu = AstarUtil.navmeshData.midu;
	        var mapW = AstarUtil.navmeshData.astarItem[0].length;
	        var mapH = AstarUtil.navmeshData.astarItem.length;
	        var tw = AstarUtil.navmeshData.aPos.x + mapW * AstarUtil.navmeshData.midu;
	        var th = AstarUtil.navmeshData.aPos.z + mapH * AstarUtil.navmeshData.midu;
	        tw = Math.max(Math.abs(AstarUtil.navmeshData.aPos.x), Math.abs(tw));
	        th = Math.max(Math.abs(AstarUtil.navmeshData.aPos.z), Math.abs(th));
	        var bsew = Math.max(tw, th);
	        bsew += 100;
	        bsew = Math.round(bsew);
	        var $infoRect = new Rectangle();
	        $infoRect.x = -bsew;
	        $infoRect.y = -bsew;
	        $infoRect.width = bsew * 2;
	        $infoRect.height = bsew * 2;
	        $infoRect.x -= 1;
	        $infoRect.y -= 1;
	        $infoRect.width += 2;
	        $infoRect.height += 2;
	        $infoRect.width /= 2;
	        $infoRect.height /= 2;
	        this.minMapRect = $infoRect;
	    }
	    static mathAreaRect() {
	        /*
	        var $minx: number = this.astarWidth;
	        var $miny: number = this.astarHeight;
	        var $maxx: number =0;
	        var $maxy: number = 0;
	        for (var i: number = 0; i < this.astarHeight; i++) {
	            for (var j: number = 0; j < this.astarWidth; j++) {
	                if (this.graphData.grid[i][j].weight==1) {
	                    if ($minx > j) {
	                        $minx = j
	                    }
	                    if ($miny > i) {
	                        $miny = i
	                    }
	 
	                    if ($maxx <j) {
	                        $maxx = j
	                    }
	                    if ($maxy < i) {
	                        $maxy = i
	                    }
	                }
	               
	 
	            }
	        }
	        //console.log("$minx", $minx);
	        //console.log("$miny", $miny);
	        //console.log("$maxx", $maxx);
	        //console.log("$maxy", $maxy);
	 
	        var tx: number = this.aPos.x + $minx * this.midu;
	        var tz: number = this.aPos.z + $miny * this.midu;
	        var tw: number = this.aPos.x + $maxx * this.midu;
	        var th: number = this.aPos.z + $maxy * this.midu;
	 
	        */
	        this.areaRect = new Rectangle;
	        this.areaRect.x = this.aPos.x;
	        this.areaRect.y = this.aPos.z;
	        this.areaRect.width = this.astarWidth * this.midu;
	        this.areaRect.height = this.astarHeight * this.midu;
	    }
	    static clear() {
	        if (this.navmeshData) {
	            this._bakData = this.navmeshData;
	            this.aPos.setTo(0, 0, 0);
	            this.navmeshData = null;
	        }
	    }
	    static porcessBak(tf) {
	        if (tf) {
	            this.setData(this._bakData);
	        }
	        //this._bakData = null;
	    }
	    static getHeightByPos($pos) {
	        if (this.heightItem) {
	            var $movePos = $pos.subtract(this.aPos).add(new Vector3D(this.midu / 2, 0, this.midu / 2));
	            var w = (this.astarWidth - 1) * this.midu;
	            var h = (this.astarHeight - 1) * this.midu;
	            if ($movePos.x > 0 && $movePos.x <= w && $movePos.z > 0 && $movePos.z <= h) {
	                return this.getBaseHeightByBitmapdata($movePos.x / this.midu, $movePos.z / this.midu);
	            }
	        }
	        return -500;
	    }
	    static getBaseHeightByBitmapdata($xpos, $ypos) {
	        var perX = $xpos - Util.float2int($xpos);
	        var perY = $ypos - Util.float2int($ypos);
	        var zero_zero = this.getBitmapDataHight(Util.float2int($xpos), Util.float2int($ypos));
	        var zero_one = this.getBitmapDataHight(Util.float2int($xpos), Math.ceil($ypos));
	        var one_zero = this.getBitmapDataHight(Math.ceil($xpos), Util.float2int($ypos));
	        var one_one = this.getBitmapDataHight(Math.ceil($xpos), Math.ceil($ypos));
	        var dis1 = (1 - perX) * (1 - perY);
	        var dis2 = (1 - perX) * perY;
	        var dis3 = perX * (1 - perY);
	        var dis4 = perX * perY;
	        var num = (dis1 * zero_zero + dis2 * zero_one + dis3 * one_zero + dis4 * one_one);
	        return num;
	    }
	    static getBitmapDataHight($tx, $ty) {
	        return this.heightItem[this.heightItem.length - 1 - $ty][$tx];
	    }
	    static findPath($a, $b) {
	        return null;
	    }
	    static Path2dTo3d(result) {
	        var astarPosItem = new Array;
	        for (var i = 0; i < result.length; i++) {
	            astarPosItem.push(this.getWorldPosByStart2D(result[i]));
	        }
	        return astarPosItem;
	    }
	    static getWorldPosByStart2D(a) {
	        if (this.navmeshData) {
	            var Apos = new Vector3D(a.x * this.midu, 3, a.y * this.midu);
	            Apos.x = Apos.x + this.aPos.x + this.midu / 2;
	            Apos.z = (this.aPos.z + this.midu * this.astarHeight) - Apos.z - this.midu / 2;
	            return Apos;
	        }
	        else {
	            return new Vector3D(a.x * 10 + this.midu / 2, 0, a.y * 10 - this.midu / 2);
	        }
	    }
	    static findPath3D($a, $b) {
	        if (this.navmeshData) {
	            if (!AstarUtil.getPosIsCanMove($b)) {
	                $b = this.findNearLinePoint($a, $b);
	            }
	            var gridVec2DA = this.getGrapIndexByPos($a);
	            var gridVec2DB = this.getGrapIndexByPos($b);
	            if (this.getJumpDataByV2d(gridVec2DB.x, gridVec2DB.y)) {
	                //console.log("是跳跃区域不可寻路", gridVec2DB.x, gridVec2DB.y)
	                return null;
	            }
	            if (!this.isGridCanWalk(gridVec2DB)) {
	                return null;
	            }
	            if (!gridVec2DA) { //特殊处理如果出去了将直接跳到目的地
	                //console.log("逻辑格位置有错")
	                return null;
	            }
	            if (this.findStraightLine(gridVec2DA, gridVec2DB)) {
	                ////console.log("直线走走走")
	                return [gridVec2DA, gridVec2DB];
	            }
	            return this.findPath2D(gridVec2DA, gridVec2DB);
	        }
	        else {
	            return [this.getGrapIndexByPos($a), this.getGrapIndexByPos($b)];
	        }
	    }
	    //是否可以直线走
	    static findStraightLine($a, $b) {
	        var $nrm = new Vector2D($b.x - $a.x, $b.y - $a.y);
	        $nrm.normalize();
	        var d = Math.round(Vector2D.distance($a, $b));
	        var p = new Vector2D;
	        for (var i = 0; i < d; i++) {
	            p.x = Math.floor($a.x + i * $nrm.x);
	            p.y = Math.floor($a.y + i * $nrm.y);
	            if (!this.isGridCanWalk(p)) {
	                return false;
	            }
	            p.x = Math.ceil($a.x + i * $nrm.x);
	            p.y = Math.ceil($a.y + i * $nrm.y);
	            if (!this.isGridCanWalk(p)) {
	                return false;
	            }
	            p.x = Math.round($a.x + i * $nrm.x);
	            p.y = Math.round($a.y + i * $nrm.y);
	            if (!this.isGridCanWalk(p)) {
	                return false;
	            }
	        }
	        return true;
	    }
	    static isGridCanWalk(p) {
	        if (p) {
	            if (!this.graphData.grid[p.y]) {
	                return false;
	            }
	            if (!this.graphData.grid[p.y][p.x]) {
	                return false;
	            }
	            if (this.graphData.grid[p.y][p.x].weight == 0) {
	                return false;
	            }
	            else {
	                return true;
	            }
	        }
	        else {
	            //console.log("没有这个点", p);
	            return false;
	        }
	    }
	    static findPath2D(gridVec2DA, gridVec2DB) {
	        return null;
	    }
	    //优化直接
	    static turnLineAstar($arr) {
	        if ($arr.length < 2) {
	            return $arr;
	        }
	        var $tempArr = [$arr[0]];
	        for (var i = 2; i < $arr.length; i++) {
	            if (!this.findStraightLine($tempArr[$tempArr.length - 1], $arr[i])) {
	                $tempArr.push($arr[i - 1]);
	            }
	        }
	        $tempArr.push($arr[$arr.length - 1]);
	        if ($arr.length != $tempArr.length) {
	            return this.turnLineAstar($tempArr);
	        }
	        return $tempArr;
	    }
	    //简化寻路结果
	    static simplifyAstar($arr) {
	        var $num = 0;
	        if ($arr.length > 1) ;
	        if ($arr.length > 2) {
	            var $back = new Array;
	            $back.push($arr[0]); //加上首个
	            for (var i = 2; i < $arr.length; i++) {
	                var a = $back[$back.length - 1];
	                var b = $arr[i - 1];
	                var c = $arr[i];
	                if (Math.atan2(b.y - a.y, b.x - a.x) != Math.atan2(c.y - a.y, c.x - a.x) || $num > 126) {
	                    $back.push(b);
	                }
	                else {
	                    $num++;
	                }
	            }
	            $back.push($arr[$arr.length - 1]); //加上最后一个
	            return $back;
	        }
	        else {
	            return $arr;
	        }
	    }
	    static findNearLinePoint($a, $b) {
	        while (Vector3D.distance($a, $b) > 5) {
	            $b = this.moveA2B($b, $a, 1);
	            if (AstarUtil.getPosIsCanMove($b)) {
	                return $b;
	                //break
	            }
	        }
	        return $b;
	    }
	    static moveA2B(a, b, speed) {
	        var c = b.subtract(a);
	        c.normalize();
	        c.scaleBy(speed);
	        c = c.add(a);
	        return c;
	    }
	    static getPosIsCanMove($pos) {
	        if (!this.graphData || !this.graphData.grid) {
	            //console.log("寻路这时是不可的a")
	            return false;
	        }
	        var $kt = this.getGrapIndexByPos($pos);
	        return this.isGridCanWalk($kt);
	        //if (!$kt||!this.graphData.grid[$kt.y] || !this.graphData.grid[$kt.y][$kt.x]) {
	        //    //console.log("寻路这时是不可的b")
	        //    return false
	        //}
	        //if ($kt && this.graphData.grid[$kt.y][$kt.x].weight) {
	        //    return true;
	        //} else {
	        //    return false;
	        //}
	    }
	    static makeStarGraph($arr) {
	    }
	    static blockAry(ary) {
	        var list = new Array;
	        for (var i = 0; i < ary.length; i++) {
	            list.push([new Vector2D(ary[i][0], ary[i][1]), new Vector2D(ary[i][2], ary[i][3])]);
	        }
	        this.blockList(list);
	    }
	    static blockList(ary) {
	        if (this.blockBakData) {
	            this.unblock();
	        }
	        this.blockBakData = new Array;
	        for (var i = 0; i < ary.length; i++) {
	            this.blockPoint(ary[i][0], ary[i][1]);
	        }
	    }
	    static blockPoint(p1, p2) {
	        var rec = new Rectangle();
	        rec.y = Math.min(p1.x, p2.x);
	        rec.x = Math.min(p1.y, p2.y);
	        rec.height = Math.abs(p1.x - p2.x);
	        rec.width = Math.abs(p1.y - p2.y);
	        this.blockRec(rec);
	    }
	    static blockRec($rec) {
	        for (var i = 0; i < $rec.width; i++) {
	            var ary = new Array;
	            for (var j = 0; j < $rec.height; j++) {
	                var idx = i + $rec.x;
	                var idy = j + $rec.y;
	                var g = this.graphData.grid[idx][idy];
	                ary.push({ i: idx, j: idy, w: g.weight });
	                g.weight = 0;
	            }
	            this.blockBakData.push(ary);
	        }
	    }
	    static unblock() {
	        if (!this.blockBakData) {
	            return;
	        }
	        for (var i = 0; i < this.blockBakData.length; i++) {
	            for (var j = 0; j < this.blockBakData[i].length; j++) {
	                var g = this.blockBakData[i][j];
	                this.graphData.grid[g.i][g.j].weight = g.w;
	            }
	        }
	        this.blockBakData = null;
	    }
	    static getGrapIndexByPos($pos) {
	        if (this.navmeshData) {
	            var $movePos = $pos.subtract(this.aPos).add(new Vector3D(0, 0, this.midu / 2));
	            var w = this.astarWidth * this.midu;
	            var h = this.astarHeight * this.midu;
	            if ($movePos.x > 0 && $movePos.x < w && $movePos.z > 0 && $movePos.z < h) {
	                return new Vector2D(Util.float2int($movePos.x / this.midu), Util.float2int(this.astarHeight - $movePos.z / this.midu));
	            }
	        }
	        else {
	            return new Vector2D(Util.float2int($pos.x / this.midu), Util.float2int($pos.z / this.midu));
	        }
	        return null;
	    }
	    static getScenePos($x, $y) {
	        var $temp = Groundposition.getGroundPos($x, $y);
	        return this.getLookAtPos($temp);
	    }
	    static getLookAtPos($hit3D) {
	        var $cam3D = new Vector3D(Scene_data.cam3D.x, Scene_data.cam3D.y, Scene_data.cam3D.z);
	        var nrm = $hit3D.subtract($cam3D);
	        nrm.normalize();
	        var $dis = 0;
	        var backB;
	        while (true) {
	            $dis += 2;
	            var $n = nrm.clone();
	            $n.scaleBy($dis);
	            var $XZ = $cam3D.add($n);
	            var $y = AstarUtil.getHeightByPos($XZ);
	            if ($y > $XZ.y) {
	                backB = $XZ;
	                break;
	            }
	            if ($dis > 1000) //当向前1000都还没找到。就退出
	             {
	                backB = null;
	                break;
	            }
	        }
	        return backB;
	    }
	}
	AstarUtil.aPos = new Vector3D;
	AstarUtil.midu = 10;
	AstarUtil.astarWidth = 0;
	AstarUtil.astarHeight = 0;
	AstarUtil._frist = false;
	AstarUtil.canwalkItem = [];

	class LightProbeManager {
	    constructor() {
	        this._defaultVec = new Array;
	        var ary = [0.4444730390920146, -0.3834955622240026, -0.33124467509627725, 0.09365654209093091,
	            -0.05673310882817577, 0.2120523322966496, 0.02945768486978205, -0.04965996229802928, -0.1136529129285836];
	        for (var i = 0; i < 9; i++) {
	            this._defaultVec.push(new Vector3D(ary[i], ary[i], ary[i]));
	        }
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new LightProbeManager();
	        }
	        return this._instance;
	    }
	    setLightProbeData($arr) {
	        this._dataAry = $arr;
	    }
	    clear() {
	        this._dataAry = null;
	    }
	    getData($pos) {
	        if (!this._dataAry) {
	            return this._defaultVec;
	        }
	        for (var i = 0; i < this._dataAry.length; i++) {
	            var lightArea = this._dataAry[i];
	            if (this.testPoint(lightArea, $pos)) {
	                var baseV3d = lightArea.postion;
	                var bp = $pos.subtract(baseV3d);
	                return this.getResultData(lightArea.posItem, Util.float2int(bp.x / lightArea.betweenNum), Util.float2int(bp.z / lightArea.betweenNum), Util.float2int(bp.y / lightArea.betweenNum), lightArea.betweenNum, bp);
	            }
	        }
	        return this._defaultVec;
	    }
	    testPoint(lightArea, $pos) {
	        var xNum = (lightArea.cubeVec.x - 1) * lightArea.betweenNum;
	        var yNum = (lightArea.cubeVec.y - 1) * lightArea.betweenNum;
	        var zNum = (lightArea.cubeVec.z - 1) * lightArea.betweenNum;
	        var cx = $pos.x - lightArea.postion.x;
	        var cy = $pos.y - lightArea.postion.y;
	        var cz = $pos.z - lightArea.postion.z;
	        if (cx >= 0 && cx < xNum && cy >= 0 && cy < yNum && cz >= 0 && cz < zNum) {
	            return true;
	        }
	        else {
	            return false;
	        }
	    }
	    getResultData(ary, x, z, y, bNum, $pos) {
	        var posAry = new Array;
	        posAry.push(new PosItem(ary[x][z][y], $pos));
	        posAry.push(new PosItem(ary[x + 1][z][y], $pos));
	        posAry.push(new PosItem(ary[x][z + 1][y], $pos));
	        posAry.push(new PosItem(ary[x + 1][z + 1][y], $pos));
	        posAry.push(new PosItem(ary[x][z][y + 1], $pos));
	        posAry.push(new PosItem(ary[x + 1][z][y + 1], $pos));
	        posAry.push(new PosItem(ary[x][z + 1][y + 1], $pos));
	        posAry.push(new PosItem(ary[x + 1][z + 1][y + 1], $pos));
	        var allDis = 0;
	        for (var i = 0; i < posAry.length; i++) {
	            allDis += posAry[i].dis;
	        }
	        for (i = 0; i < posAry.length; i++) {
	            posAry[i].setBais(allDis);
	        }
	        var allBais = 0;
	        for (i = 0; i < posAry.length; i++) {
	            allBais += posAry[i].bais;
	        }
	        for (i = 0; i < posAry.length; i++) {
	            posAry[i].bais = posAry[i].bais / allBais;
	        }
	        var arr = new Array;
	        for (i = 0; i < 9; i++) {
	            var v3d = new Vector3D;
	            for (var j = 0; j < posAry.length; j++) {
	                var tempV3d = new Vector3D(posAry[j].vecNum[i].x, posAry[j].vecNum[i].y, posAry[j].vecNum[i].z);
	                tempV3d.scaleBy(posAry[j].bais);
	                v3d = v3d.add(tempV3d);
	            }
	            arr.push(v3d);
	        }
	        return arr;
	    }
	}
	class PosItem {
	    constructor(basePos, centerPos) {
	        this.pos = new Vector3D(basePos.x, basePos.y, basePos.z);
	        this.vecNum = basePos.resultSHVec;
	        this.dis = Vector3D.distance(this.pos, centerPos);
	    }
	    setBais(allDis) {
	        this.bais = (this.dis / allDis) * (this.dis / allDis);
	        this.bais = 1 / this.bais;
	    }
	}

	class SceneManager {
	    constructor() {
	        //private _sceneLoader: SceneRes;
	        this._ready = false;
	        this.render = true;
	        this._displayList = new Array;
	        this._displaySpriteList = new Array;
	        this._displayRoleList = new Array;
	        this._display2DList = new Array;
	        this._sceneParticleList = new Array;
	        this._time = TimeUtil.getTimer();
	        //this.initSceneLoader()
	        this._sceneDic = new Object;
	        //var buildShader: BuildShader = new BuildShader();
	        //ProgrmaManager.getInstance().registe(BuildShader.buildShader, buildShader);
	        //var skyShader: SkyShader = new SkyShader();
	        //ProgrmaManager.getInstance().registe(SkyShader.Sky_Shader, skyShader);
	        //ProgrmaManager.getInstance().registe(LineDisplayShader.LineShader, new LineDisplayShader());
	        this.initScene();
	        this.viewFrustum = new ViewFrustum();
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new SceneManager();
	        }
	        return this._instance;
	    }
	    get displayList() {
	        return this._displayList;
	    }
	    get displayRoleList() {
	        return this._displayRoleList;
	    }
	    get displaySpriteList() {
	        return this._displaySpriteList;
	    }
	    // private initSceneLoader(): void {
	    //     if (!Scene_data.supportBlob) {
	    //         //this._sceneLoader = new SceneResLow();
	    //     } else {
	    //        // this._sceneLoader = new SceneRes();
	    //     }
	    // }
	    clearScene() {
	        //this.clearStaticScene();
	        this._displayRoleList.length = 0;
	    }
	    clearStaticScene() {
	        //console.log("场景场景所有对象");
	        for (var key in this._sceneDic) {
	            var obj = this._sceneDic[key];
	            if (obj instanceof CombineParticle) {
	                ParticleManager.getInstance().removeParticle(obj);
	                obj.destory();
	            }
	            else if (obj instanceof Display3DSprite) {
	                obj.removeStage();
	                obj.destory();
	            }
	        }
	        this._ready = false;
	        this._sceneDic = null;
	        this._sceneQuadTree = null;
	        this._displayList.length = 0;
	        this._sceneParticleList.length = 0;
	        AstarUtil.porcessBak(false);
	    }
	    testUrl($url) {
	        return this._currentUrl == $url;
	    }
	    loadScene($url, $completeFun, $progressFun, $analysisCompleteFun) {
	        if (this._currentUrl == $url) { //原场景不加载
	            AstarUtil.porcessBak(true);
	            this._ready = true;
	            $completeFun();
	            $analysisCompleteFun();
	            return;
	        }
	        this.clearStaticScene();
	        this._ready = false;
	        ResManager.getInstance().loadSceneRes($url, $completeFun, $progressFun, ($str) => {
	            this.loadSceneConfigCom($str);
	            $analysisCompleteFun();
	        });
	        this._currentUrl = $url;
	    }
	    getDisplayByID($type, $id) {
	        if ($type == 0) {
	            return this._sceneDic["build" + $id];
	        }
	        else if ($type == 1) {
	            return this._sceneDic["particle" + $id];
	        }
	    }
	    fixAstart(pos) {
	        for (var i = 0; i < this._displayRoleList.length; i++) {
	            this._displayRoleList[i].fixAstartData(pos);
	        }
	    }
	    loadSceneConfigCom(obj) {
	        this._sceneDic = new Object();
	        var groundAry = obj.groundItem;
	        var buildAry = obj.buildItem;
	        Scene_data.fogColor = [obj.fogColor.x / 255.0, obj.fogColor.y / 255.0, obj.fogColor.z / 255.0];
	        //  //console.log(obj.fogDistance)
	        var d = obj.fogDistance * 1; //1000
	        var s = obj.fogAttenuation; //0.5.
	        Scene_data.gameAngle = isNaN(obj.gameAngle) ? 0 : obj.gameAngle;
	        Scene_data.focus3D.rotationY = Scene_data.gameAngle;
	        Scene_data.fogData = [d * s, 1 / ((1 - s) * d)];
	        Scene_data.sceneNumId++;
	        for (var j = 0; groundAry && j < groundAry.length; j++) {
	            var groundDisplay = this.getGroundSprite(groundAry[j], obj.terrain);
	            this.addDisplay(groundDisplay);
	        }
	        for (var i = 0; i < buildAry.length; i++) {
	            var itemObj = buildAry[i];
	            if (itemObj.type == BaseRes.PREFAB_TYPE) {
	                var itemDisplay = this.getBuildSprite(itemObj);
	                this.addDisplay(itemDisplay);
	            }
	            else if (itemObj.type == BaseRes.SCENE_PARTICLE_TYPE) {
	                var particle = this.getParticleSprite(itemObj);
	                ParticleManager.getInstance().addParticle(particle);
	                this._sceneParticleList.push(particle);
	            }
	        }
	        Scene_data.light.setData(obj.SunNrm, obj.SunLigth, obj.AmbientLight);
	        LightProbeManager.getInstance().setLightProbeData(obj.lightProbeItem);
	        AstarUtil.setData(obj.astar);
	        this._ready = true;
	        if (obj.quadTreeData) {
	            this._sceneQuadTree = new SceneQuadTree();
	            this._sceneQuadTree.init(obj.quadTreeData, this._sceneDic);
	        }
	        else {
	            this._sceneQuadTree = null;
	        }
	        // this.viewFrustum.setData(obj.aabb);
	    }
	    getGroundSprite(itemObj, terrain) {
	        var itemDisplay = new TerrainDisplay3DSprite();
	        itemDisplay.setObjUrl(itemObj.objsurl);
	        itemDisplay.setMaterialUrl(itemObj.materialurl, itemObj.materialInfoArr);
	        itemDisplay.materialInfoArr = itemObj.materialInfoArr;
	        itemDisplay.setLightMapUrl(itemObj.lighturl);
	        itemDisplay.scaleX = itemObj.scaleX;
	        itemDisplay.scaleY = itemObj.scaleY;
	        itemDisplay.scaleZ = itemObj.scaleZ;
	        itemDisplay.x = itemObj.x;
	        itemDisplay.y = itemObj.y;
	        itemDisplay.z = itemObj.z;
	        itemDisplay.rotationX = itemObj.rotationX;
	        itemDisplay.rotationY = itemObj.rotationY;
	        itemDisplay.rotationZ = itemObj.rotationZ;
	        itemDisplay.objData.lightuvsOffsets = itemDisplay.objData.uvsOffsets;
	        if (terrain) {
	            itemDisplay.setGrounDataMesh(terrain[itemObj.id]);
	        }
	        this._sceneDic["ground" + itemObj.id] = itemDisplay;
	        return itemDisplay;
	    }
	    makeCollisioin(arr) {
	    }
	    set ready($value) {
	        //console.log("--setready--", $value);
	        this._ready = $value;
	    }
	    get ready() {
	        return this._ready;
	    }
	    getBuildSprite(itemObj) {
	        var itemDisplay = new Display3DSprite();
	        itemDisplay.setObjUrl(itemObj.objsurl);
	        itemDisplay.setMaterialUrl(itemObj.materialurl, itemObj.materialInfoArr);
	        itemDisplay.materialInfoArr = itemObj.materialInfoArr;
	        itemDisplay.setLightMapUrl(itemObj.lighturl);
	        itemDisplay.scaleX = itemObj.scaleX;
	        itemDisplay.scaleY = itemObj.scaleY;
	        itemDisplay.scaleZ = itemObj.scaleZ;
	        itemDisplay.x = itemObj.x;
	        itemDisplay.y = itemObj.y;
	        itemDisplay.z = itemObj.z;
	        itemDisplay.rotationX = itemObj.rotationX;
	        itemDisplay.rotationY = itemObj.rotationY;
	        itemDisplay.rotationZ = itemObj.rotationZ;
	        itemDisplay.isPerspective = itemObj.isPerspective;
	        itemDisplay.type = 0;
	        itemDisplay.id = itemObj.id;
	        this._sceneDic["build" + itemObj.id] = itemDisplay;
	        return itemDisplay;
	    }
	    getParticleSprite(itemObj) {
	        var particle;
	        particle = ParticleManager.getInstance().getParticleByte(Scene_data.fileRoot + itemObj.url);
	        particle.scaleX = itemObj.scaleX;
	        particle.scaleY = itemObj.scaleY;
	        particle.scaleZ = itemObj.scaleZ;
	        particle.x = itemObj.x;
	        particle.y = itemObj.y;
	        particle.z = itemObj.z;
	        particle.rotationX = itemObj.rotationX;
	        particle.rotationY = itemObj.rotationY;
	        particle.rotationZ = itemObj.rotationZ;
	        particle.type = 0;
	        this._sceneDic["particle" + itemObj.id] = particle;
	        return particle;
	    }
	    initScene() {
	        return;
	        //this._displayList.push(new GridLineSprite());
	    }
	    addDisplay($display) {
	        if (this._displayList.indexOf($display) != -1) {
	            return;
	        }
	        this._displayList.push($display);
	        $display.addStage();
	    }
	    removeDisplay($display) {
	        var index = this._displayList.indexOf($display);
	        if (index != -1) {
	            this._displayList.splice(index, 1);
	        }
	        $display.removeStage();
	    }
	    /**
	     * 动态添加的staticMesh 物件例如武器等
	    */
	    addSpriteDisplay($display) {
	        if (this._displaySpriteList.indexOf($display) != -1) {
	            return;
	        }
	        $display.addStage();
	        for (var i = 0; i < this._displaySpriteList.length; i++) {
	            if (this._displaySpriteList[i].materialUrl == $display.materialUrl) {
	                this._displaySpriteList.splice(i, 0, $display);
	                return;
	            }
	        }
	        this._displaySpriteList.push($display);
	    }
	    removeSpriteDisplay($display) {
	        var index = this._displaySpriteList.indexOf($display);
	        if (index != -1) {
	            this._displaySpriteList.splice(index, 1);
	        }
	        $display.removeStage();
	    }
	    /**
	     * 动态添加的骨骼动画角色
	     */
	    addMovieDisplay($display) {
	        this._displayRoleList.push($display);
	        $display.addStage();
	    }
	    addMovieDisplayTop($display) {
	        this._displayRoleList.unshift($display);
	        $display.addStage();
	    }
	    removeMovieDisplay($display) {
	        var index = this._displayRoleList.indexOf($display);
	        if (index != -1) {
	            this._displayRoleList.splice(index, 1);
	        }
	        $display.removeStage();
	    }
	    setParticleVisible() {
	        var $arr = ParticleManager.getInstance().particleList;
	        for (var i = 0; $arr && i < $arr.length; i++) {
	            if (!$arr[i].dynamic && $arr[i].bindVecter3d) {
	                var dis = Vector3D.distance(new Vector3D(Scene_data.focus3D.x, Scene_data.focus3D.y, Scene_data.focus3D.z), new Vector3D($arr[i].x, $arr[i].y, $arr[i].z));
	                $arr[i].sceneVisible = (dis < 1000);
	            }
	        }
	    }
	    /*  public static mapQudaTreeDistance: number = 200;
	     public test: boolean = false;
	     public update(): void {
	         if (this.test) {
	             return;
	         }
	         if (this._sceneQuadTree) {
	             this._sceneQuadTree.setCircle(Scene_data.focus3D.x, Scene_data.focus3D.z, SceneManager.mapQudaTreeDistance);
	             if (this._sceneQuadTree.needUpdata) {
	                 for (var i: number = 0; i < this._displayList.length; i++) {
	                     this._displayList[i].sceneVisible = false;
	                     this._displayList[i].sceneVisible = true;
	                 }
	 
	                 this.setParticleVisible()
	                 this._sceneQuadTree.update();
	                 this.mathCamFar()
	             }
	         }
	 
	         Scene_data.context3D.update();
	 
	         Scene_data.context3D.setDepthTest(false);
	 
	         Scene_data.context3D.setDepthTest(true);
	         this.updateMovieFrame();
	         MathClass.getCamView(Scene_data.cam3D, Scene_data.focus3D); //一定要角色帧渲染后再重置镜头矩阵
	         if (this._ready) {
	 
	             ParticleManager.getInstance().updateTime();
	             SkillManager.getInstance().update();
	 
	             if (this.render) {
	                 this.updateStaticDiplay();
	                 this.updateSpriteDisplay();
	                 Scene_data.context3D.setWriteDepth(true);
	                 Scene_data.context3D.clearTest();
	                 this.updateMovieDisplay();
	                 ShadowManager.getInstance().update();
	                 Scene_data.context3D.setWriteDepth(false);
	                 ParticleManager.getInstance().update();
	             }
	         }
	         
	         Scene_data.context3D.setDepthTest(false);
	 
	         // msgtip.MsgTipManager.getInstance().update()
	 
	         for (var i: number = 0; i < this._display2DList.length; i++) {
	             this._display2DList[i].update()
	         }
	 
	     } */
	    addDisplay2DList($dis) {
	        this._display2DList.push($dis);
	    }
	    mathCamFar() {
	        var $p = new Vector3D;
	        var $far = 0;
	        for (var i = 0; i < this._displayList.length; i++) {
	            var $dis = this._displayList[i];
	            if ($dis.sceneVisible && $dis.aabb) {
	                var $m = $dis.posMatrix.clone();
	                $m.append(Scene_data.cam3D.cameraMatrix);
	                var $aabbVect = $dis.aabbVect;
	                for (var k = 0; k < $aabbVect.length; k++) {
	                    $p = Scene_data.cam3D.cameraMatrix.transformVector($aabbVect[k]);
	                    if ($p.z > $far) {
	                        $far = $p.z;
	                    }
	                }
	                /*
	                if (this._displayList[i].objData) {
	                
	                    for (var j: number = 0; j < $dis.objData.vertices.length/3; j++) {
	                        $p.x = $dis.objData.vertices[j * 3 + 0]
	                        $p.y = $dis.objData.vertices[j * 3 + 1]
	                        $p.z = $dis.objData.vertices[j * 3 + 2]
	                        $p = $dis.posMatrix.transformVector($p);
	                        $p=Scene_data.cam3D.cameraMatrix.transformVector($p)
	                        if ($p.z > $far) {
	                            $far = $p.z
	                        }
	                    }
	                }
	                */
	            }
	        }
	        Scene_data.camFar = Math.max(500, $far + 100);
	        Engine.resetViewMatrx3D();
	    }
	    updateStaticDiplay() {
	        for (var i = 0; i < this._displayList.length; i++) {
	            this._displayList[i].update();
	            // if (this._displayList[i].sceneVisible) {
	            //     num++;
	            // }
	        }
	        // FpsMc.tipStr = "drawNum:" + (num + this._displayRoleList.length) + "/" + this._displayList.length; 
	    }
	    updateStaticBind() {
	        // for (var i: number = 0; i < this._displayList.length; i++) {
	        //     this._displayList[i].updateBind();
	        // }
	    }
	    updateSpriteDisplay() {
	        for (var i = 0; i < this._displaySpriteList.length; i++) {
	            this._displaySpriteList[i].update();
	        }
	    }
	    renderShadow() {
	        let gl = Scene_data.context3D.renderContext;
	        /**/
	        gl.enable(gl.STENCIL_TEST);
	        gl.clear(gl.STENCIL_BUFFER_BIT);
	        gl.stencilMask(0xFFFF);
	        gl.clearStencil(0xFFFF);
	        gl.stencilFunc(gl.EQUAL, 0xFFFF, 0xFFFF);
	        gl.stencilOp(gl.KEEP, gl.KEEP, gl.ZERO);
	        //gl.enable(gl.BLEND);
	        //gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	        gl.blendFunc(1, 771);
	        for (var i = 0; i < this._displayRoleList.length; i++) {
	            if (!this._displayRoleList[i].sceneVisible)
	                continue;
	            this._displayRoleList[i].renderAnimPlanarShadowAll();
	        }
	        for (var i = 0; i < this._displaySpriteList.length; i++) {
	            if (!this._displaySpriteList[i].sceneVisible)
	                continue;
	            this._displaySpriteList[i].renderShadow();
	        }
	        gl.disable(gl.STENCIL_TEST);
	    }
	    updateMovieDisplay() {
	        for (var i = 0; i < this._displayRoleList.length; i++) {
	            this._displayRoleList[i].update();
	        }
	        if (this._displayRoleList.length) {
	            Scene_data.context3D.setVa(1, 3, null); //如果有角色,在这里要将顶点置空  ->$$$ 需要优化。这里临时处理
	        }
	    }
	    updateMovieFrame() {
	        var t = TimeUtil.getTimer();
	        var delay = t - this._time;
	        this._time = t;
	        for (var i = 0; i < this._displayRoleList.length; i++) {
	            this._displayRoleList[i].updateFrame(delay);
	        }
	        //  FpsMc.tipStr = "人数:" + (this._displayRoleList.length) 
	    }
	}
	SceneManager.scaleWorld = new Vector3D(1, 1, 1);

	class SkillPath {
	    constructor() {
	        /**
	        * 当前方向
	        */
	        this._currentDirect = new Vector3D;
	    }
	    update(t) {
	        this.time = t;
	        if (this.hasReached) {
	            this.endTime += t;
	            if (this.endTime > 200) {
	                this.applyArrive();
	            }
	            return;
	        }
	        if (this.skillTrajectory.setCurrentPos()) {
	            this._currentDirect.x = this.currentTargetPos.x - this.currentPos.x;
	            this._currentDirect.y = this.currentTargetPos.y - this.currentPos.y;
	            this._currentDirect.z = this.currentTargetPos.z - this.currentPos.z;
	            this._currentDirect.normalize();
	            this._currentDirect.scaleBy(this.speed);
	            this.setRotationMatrix(this.currentTargetPos.subtract(this.currentPos));
	            if (this._currentDirect.length == 0) {
	                this.arrive();
	                return;
	            }
	        }
	        var currentDistance = this._currentDirect.length * this.time;
	        if (!this.hasReached) {
	            var targetDistance = Vector3D.distance(this.currentPos, this.currentTargetPos);
	            this.currentPos.x += this._currentDirect.x * this.time;
	            this.currentPos.y += this._currentDirect.y * this.time;
	            this.currentPos.z += this._currentDirect.z * this.time;
	        }
	        if (currentDistance > targetDistance) {
	            this.arrive();
	        }
	        //this.distance += currentDistance;
	    }
	    setRotationMatrix($newPos) {
	        $newPos.normalize();
	        var base = new Vector3D(0, 0, 1);
	        var axis = base.cross($newPos);
	        axis.normalize();
	        var angle = Math.acos($newPos.dot(base));
	        var qu = new Quaternion();
	        qu.fromAxisAngle(axis, angle);
	        qu.toMatrix3D(this.rotationMatrix);
	    }
	    arrive() {
	        this.hasReached = true;
	    }
	    applyArrive() {
	        this.endFun();
	        if (this.bloodFun) {
	            this.bloodFun();
	        }
	    }
	    reset() {
	        this.hasReached = false;
	        this._currentDirect.setTo(0, 0, 0);
	        this.endTime = 0;
	    }
	    add() {
	    }
	    setData($skillTrajectory, $endFun, $currentPos, $rotationMatrix, $currentTargetPos, $bloodFun) {
	        this.skillTrajectory = $skillTrajectory;
	        this.currentPos = $currentPos;
	        this.rotationMatrix = $rotationMatrix;
	        this.currentTargetPos = $currentTargetPos;
	        this.endFun = $endFun;
	        this.bloodFun = $bloodFun;
	    }
	}

	class SkillSinPath extends SkillPath {
	    constructor() {
	        super(...arguments);
	        this.basePos = new Vector3D;
	    }
	    add() {
	        this.skillTrajectory.setCurrentPos();
	        var v3d = new Vector3D();
	        v3d.x = this.currentTargetPos.x - this.currentPos.x;
	        v3d.y = this.currentTargetPos.y - this.currentPos.y;
	        v3d.z = this.currentTargetPos.z - this.currentPos.z;
	        this.basePos.setTo(this.currentPos.x, this.currentPos.y, this.currentPos.z);
	        this.alltime = v3d.length / this.speed;
	    }
	    update(t) {
	        this.time = t;
	        this.lastTime += t;
	        if (this.hasReached) {
	            this.endTime += t;
	            if (this.endTime > 200) {
	                this.applyArrive();
	            }
	            return;
	        }
	        this.skillTrajectory.setCurrentPos();
	        var ypos = (this.lastTime / this.alltime);
	        if (ypos > 1) {
	            ypos = 1;
	        }
	        //ypos = ypos - ypos * ypos;   
	        //ypos *= 150; 
	        var offsetv3d = this.getOffset(ypos);
	        this._currentDirect.x = this.currentTargetPos.x - this.basePos.x;
	        this._currentDirect.y = this.currentTargetPos.y - this.basePos.y;
	        this._currentDirect.z = this.currentTargetPos.z - this.basePos.z;
	        this._currentDirect.normalize();
	        this._currentDirect.scaleBy(this.speed);
	        this.setRotationMatrix(this.currentTargetPos.subtract(this.basePos));
	        if (this._currentDirect.length == 0) {
	            this.arrive();
	            return;
	        }
	        var currentDistance = this._currentDirect.length * this.time;
	        if (!this.hasReached) {
	            var targetDistance = Vector3D.distance(this.basePos, this.currentTargetPos);
	            this.basePos.x += this._currentDirect.x * this.time;
	            this.basePos.y += this._currentDirect.y * this.time;
	            this.basePos.z += this._currentDirect.z * this.time;
	            // this.currentPos.x = this.basePos.x + ypos;
	            // this.currentPos.y = this.basePos.y;
	            // this.currentPos.z = this.basePos.z;
	            this.setApplyPos(offsetv3d);
	        }
	        if (currentDistance > targetDistance) {
	            this.arrive();
	        }
	        //this.distance += currentDistance;
	    }
	    setApplyPos($offset) {
	        this.currentPos.x = this.basePos.x + $offset.x;
	        this.currentPos.y = this.basePos.y + $offset.y;
	        this.currentPos.z = this.basePos.z + $offset.z;
	    }
	    getOffset(ypos) {
	        ypos = Math.sin(ypos * Math.PI) * 100;
	        var offsetv3d = this._currentDirect.cross(new Vector3D(0, 1, 0));
	        offsetv3d.scaleBy(ypos);
	        return new Vector3D;
	    }
	    reset() {
	        super.reset();
	        this.lastTime = 0;
	    }
	}
	class SkillCosPath extends SkillSinPath {
	    getOffset(ypos) {
	        ypos = (ypos - ypos * ypos) * 300; //Math.sin(ypos * Math.PI) * 100;
	        var offsetv3d = this._currentDirect.cross(new Vector3D(0, -1, 0));
	        offsetv3d.scaleBy(ypos);
	        return new Vector3D;
	    }
	}

	class PathManager {
	    static reg(types, cls) {
	        this.dic[types] = cls;
	    }
	    static getNewPath(types) {
	        var cls = this.dic[types];
	        return new cls();
	    }
	    static init() {
	        this.dic[0] = SkillPath;
	        this.dic[1] = SkillSinPath;
	        this.dic[2] = SkillCosPath;
	    }
	}
	PathManager.dic = new Object;

	class SkillKey {
	    constructor() {
	        this.time = 0;
	    }
	    addToRender() {
	        if (!this.particle) {
	            return;
	        }
	        this.particle.reset();
	        this.particle.sceneVisible = true;
	        ParticleManager.getInstance().addParticle(this.particle);
	    }
	    setInfo(obj) {
	        this.time = obj.frame * Scene_data.frameTime;
	        this.particle = ParticleManager.getInstance().getParticleByte(Scene_data.fileRoot + obj.url);
	    }
	    reset() {
	        //this.time = 0;
	        this.particle.reset();
	        ParticleManager.getInstance().removeParticle(this.particle);
	    }
	    destory() {
	        this.particle.destory();
	        this.particle = null;
	        this.removeCallFun = null;
	    }
	}

	class SkillTrajectory extends SkillKey {
	    constructor() {
	        super();
	        this._currentPos = new Vector3D;
	        this.rotationMatrix = new Matrix3D;
	        this._socketMaxrix = new Matrix3D;
	        this._currentTargetPos = new Vector3D;
	        //this.path = new SkillSinPath();
	        //this.path.setData(this, () => { this.applyArrive() } ,this._currentPos, this.rotationMatrix, this._currentTargetPos);
	    }
	    getIsShadow() {
	        return false;
	    }
	    update(t) {
	        this.path.update(t);
	    }
	    reset() {
	        super.reset();
	        //if(false){ 
	        if (this.endParticle) {
	            ParticleManager.getInstance().addParticle(this.endParticle);
	            this.endParticle.reset();
	            this.endParticle.setPos(this._currentTargetPos.x, this._currentTargetPos.y, this._currentTargetPos.z);
	        }
	        if (this.removeCallFun) {
	            this.removeCallFun(this);
	        }
	    }
	    endPlayFun(e = null) {
	        ParticleManager.getInstance().removeParticle(this.endParticle);
	        this.endParticle.removeEventListener(BaseEvent.COMPLETE, this.endPlayFun, this);
	    }
	    setCurrentPos() {
	        if (this.data.hitSocket) {
	            var targetMovie = (this.target);
	            if (targetMovie) {
	                targetMovie.getSocket(this.data.hitSocket, this._socketMaxrix);
	                this._currentTargetPos.setTo(this._socketMaxrix.position.x, this._socketMaxrix.position.y, this._socketMaxrix.position.z);
	            }
	            return true;
	        }
	        else {
	            if (this._currentTargetPos.x == this.target.x && this._currentTargetPos.y == this.target.y && this._currentTargetPos.z == this.target.z) {
	                return false;
	            }
	            else {
	                this._currentTargetPos.setTo(this.target.x, this.target.y, this.target.z);
	                return true;
	            }
	        }
	    }
	    addToRender() {
	        super.addToRender();
	        var beginPos;
	        if (this.data.beginType == 0) {
	            var ma = new Matrix3D;
	            ma.appendRotation(this.active.rotationY, Vector3D.Y_AXIS);
	            beginPos = ma.transformVector(this.data.beginPos);
	            this._currentPos.setTo(this.active.x + beginPos.x, this.active.y + beginPos.y, this.active.z + beginPos.z);
	        }
	        else if (this.data.beginType == 1) {
	            var tempMa = new Matrix3D;
	            var bindActive = (this.active);
	            bindActive.getSocket(this.data.beginSocket, tempMa);
	            beginPos = tempMa.position;
	            this._currentPos.setTo(beginPos.x, beginPos.y, beginPos.z);
	        }
	        this.particle.setPos(this._currentPos.x, this._currentPos.y, this._currentPos.z);
	        this.path.add();
	    }
	    getSocket(socketName, resultMatrix) {
	        resultMatrix.identity();
	        resultMatrix.append(this.rotationMatrix);
	        resultMatrix.appendTranslation(this._currentPos.x, this._currentPos.y, this._currentPos.z);
	    }
	    getSunType() {
	        return 0;
	    }
	    setInfo(obj) {
	        super.setInfo(obj);
	        this.particle.bindTarget = this;
	        this.data = obj;
	        //this.path.speed = this.data.speed;
	        if (this.data.endParticleUrl) {
	            this.endParticle = ParticleManager.getInstance().getParticleByte(Scene_data.fileRoot + this.data.endParticleUrl);
	            this.endParticle.addEventListener(BaseEvent.COMPLETE, this.endPlayFun, this);
	        }
	    }
	    setPlayData($active, $target, $removeCallFun, types = 0, $bloodFun = null) {
	        this.active = $active;
	        this.target = $target;
	        this.removeCallFun = $removeCallFun;
	        this._currentPos.setTo(0, 0, 0);
	        this.rotationMatrix.identity();
	        this._socketMaxrix.identity();
	        this._currentTargetPos.setTo(0, 0, 0);
	        if (!this.path) {
	            this.path = PathManager.getNewPath(2);
	            this.path.setData(this, () => { this.reset(); }, this._currentPos, this.rotationMatrix, this._currentTargetPos, $bloodFun);
	            this.path.speed = this.data.speed;
	        }
	        this.path.reset();
	    }
	    destory() {
	        super.destory();
	        this.active = null;
	        this.target = null;
	        this.data = null;
	        this._currentPos = null;
	        this.rotationMatrix = null;
	        this._socketMaxrix = null;
	        this._currentTargetPos = null;
	        this.path = null;
	    }
	}

	class Display3DShadowShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Pos");
	        $context.bindAttribLocation(this.program, 1, "v2uv");
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec3 v3Pos;" +
	            "attribute vec3 v2uv;" +
	            "uniform mat4 viewMatrix3D;" +
	            "uniform mat4 camMatrix3D;" +
	            "uniform vec4 pos[30];" +
	            "varying vec2 v_texCoord;" +
	            "void main(void)" +
	            "{" +
	            "   v_texCoord = vec2(v2uv.x, v2uv.y);" +
	            "   vec3 vt1= vec3(v3Pos.xyz * pos[int(v2uv.z)].w + pos[int(v2uv.z)].xyz);" +
	            "   vec4 vt0= vec4(vt1, 1.0);" +
	            "   vt0 = camMatrix3D * vt0;" +
	            "   vt0 = viewMatrix3D * vt0;" +
	            "   gl_Position = vt0;" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = " precision mediump float;\n" +
	            "uniform sampler2D s_texture;\n" +
	            "varying vec2 v_texCoord;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(s_texture, v_texCoord.xy);\n" +
	            "infoUv.xyz *= infoUv.w;\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	Display3DShadowShader.Display3DShadowShader = "Display3DShadowShader";

	class Display3dShadow extends Display3D {
	    constructor() {
	        super();
	        this.needUpdate = false;
	        this.locationFloat32 = new Float32Array(0);
	        this.shadowList = new Array;
	        this.objData = new ObjData;
	        this.shader = ProgramManager.getInstance().getProgram(Display3DShadowShader.Display3DShadowShader);
	        this.program = this.shader.program;
	        this.posProLocation = Scene_data.context3D.getLocation(this.program, "pos");
	    }
	    addShadow($shdow) {
	        this.shadowList.push($shdow);
	        $shdow.display = this;
	        this.applyObjData();
	    }
	    removeShadow($shdow) {
	        var index = this.shadowList.indexOf($shdow);
	        if (index != -1) {
	            this.shadowList.splice(index, 1);
	            this.applyObjData();
	        }
	        if (this.shadowList.length == 0) ;
	    }
	    stateChage() {
	        for (var i = 0; i < this.shadowList.length; i++) {
	            if (this.shadowList[i].visible) {
	                break;
	            }
	        }
	        if (i == this.shadowList.length) {
	            this.needUpdate = false;
	        }
	        else {
	            this.needUpdate = true;
	        }
	    }
	    hasIdle() {
	        return this.shadowList.length < 30;
	    }
	    applyObjData() {
	        this.objData.vertices.length = 0;
	        this.objData.uvs.length = 0;
	        this.objData.indexs.length = 0;
	        var wh = 1;
	        for (var i = 0; i < this.shadowList.length; i++) {
	            this.objData.vertices.push(-wh, 0, wh, wh, 0, wh, wh, 0, -wh, -wh, 0, -wh);
	            this.objData.uvs.push(0, 0, i, 0, 1, i, 1, 1, i, 1, 0, i);
	            this.objData.indexs.push(i * 4, 1 + i * 4, 2 + i * 4, i * 4, 2 + i * 4, 3 + i * 4);
	        }
	        this.objData.treNum = this.shadowList.length * 6;
	        if (this.objData.vertexBuffer) {
	            Scene_data.context3D.uploadBuff3DByBuffer(this.objData.vertexBuffer, this.objData.vertices);
	            Scene_data.context3D.uploadBuff3DByBuffer(this.objData.uvBuffer, this.objData.uvs);
	            Scene_data.context3D.uploadIndexBuff3DByBuffer(this.objData.indexBuffer, this.objData.indexs);
	        }
	        else {
	            this.objData.vertexBuffer = Scene_data.context3D.uploadBuff3D(this.objData.vertices);
	            this.objData.uvBuffer = Scene_data.context3D.uploadBuff3D(this.objData.uvs);
	            this.objData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(this.objData.indexs);
	        }
	    }
	    update() {
	        if (!this.needUpdate || this.shadowList.length == 0) {
	            return;
	        }
	        if (this.objData.treNum) {
	            Scene_data.context3D.setBlendParticleFactors(0);
	            Scene_data.context3D.setProgram(this.program);
	            Scene_data.context3D.setVcMatrix4fv(this.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	            Scene_data.context3D.setVcMatrix4fv(this.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	            if (this.locationFloat32.length != this.shadowList.length * 4) {
	                this.locationFloat32 = new Float32Array(this.shadowList.length * 4);
	            }
	            for (var i = 0; i < this.shadowList.length; i++) {
	                //Scene_data.context3D.setVc4fv(this.program, "pos[" + i + "]", this.shadowList[i].data);
	                if (!this.shadowList[i].visible) {
	                    //Scene_data.context3D.setVc4fvLocation(this.locationAry[i], [0, 10000, 0, 0]);
	                    this.locationFloat32[i * 4 + 0] = 0;
	                    this.locationFloat32[i * 4 + 1] = 10000;
	                    this.locationFloat32[i * 4 + 2] = 0;
	                    this.locationFloat32[i * 4 + 3] = 0;
	                }
	                else {
	                    this.locationFloat32[i * 4 + 0] = this.shadowList[i].data[0];
	                    this.locationFloat32[i * 4 + 1] = this.shadowList[i].data[1];
	                    this.locationFloat32[i * 4 + 2] = this.shadowList[i].data[2];
	                    this.locationFloat32[i * 4 + 3] = this.shadowList[i].data[3];
	                }
	            }
	            Scene_data.context3D.setVc4fvLocation(this.posProLocation, this.locationFloat32);
	            Scene_data.context3D.setVa(0, 3, this.objData.vertexBuffer);
	            Scene_data.context3D.setVa(1, 3, this.objData.uvBuffer);
	            Scene_data.context3D.setRenderTexture(this.shader, "s_texture", Display3dShadow.texture, 0);
	            Scene_data.context3D.drawCall(this.objData.indexBuffer, this.objData.treNum);
	        }
	    }
	}

	class Shadow {
	    constructor() {
	        this._visible = false;
	        this.data = [0, 0, 0, 5];
	    }
	    set visible(value) {
	        this._visible = value;
	        this.display.stateChage();
	    }
	    get visible() {
	        return this._visible;
	    }
	    set x(value) {
	        this.data[0] = value;
	    }
	    get x() {
	        return this.data[0];
	    }
	    set y(value) {
	        this.data[1] = value;
	    }
	    get y() {
	        return this.data[1];
	    }
	    set z(value) {
	        this.data[2] = value;
	    }
	    get z() {
	        return this.data[2];
	    }
	    set size(value) {
	        this.data[3] = value;
	    }
	    get size() {
	        return this.data[3];
	    }
	}

	class ShadowManager {
	    constructor() {
	        this._displayList = new Array;
	        ProgramManager.getInstance().registe(Display3DShadowShader.Display3DShadowShader, new Display3DShadowShader());
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new ShadowManager();
	        }
	        return this._instance;
	    }
	    addShadow() {
	        var display = this.getIdleShadow();
	        var sd = new Shadow();
	        display.addShadow(sd);
	        return sd;
	    }
	    removeShadow(sd) {
	        sd.display.removeShadow(sd);
	    }
	    update() {
	        if (this._displayList.length) {
	            Scene_data.context3D.setWriteDepth(false);
	            for (var i = 0; i < this._displayList.length; i++) {
	                this._displayList[i].update();
	            }
	            Scene_data.context3D.setWriteDepth(true);
	        }
	    }
	    getIdleShadow() {
	        for (var i = 0; i < this._displayList.length; i++) {
	            if (this._displayList[i].hasIdle()) {
	                return this._displayList[i];
	            }
	        }
	        var display = new Display3dShadow();
	        this._displayList.push(display);
	        return display;
	    }
	}

	class GroupRes extends BaseRes {
	    load(url, $fun) {
	        this._fun = $fun;
	        LoadManager.getInstance().load(url, LoadManager.BYTE_TYPE, ($byte) => {
	            this.loadComplete($byte);
	        });
	    }
	    loadComplete($byte) {
	        this.dataAry = new Array;
	        this._byte = new Pan3dByteArray($byte);
	        this._byte.position = 0;
	        this.version = this._byte.readInt();
	        this.read(() => { this.readNext(); }); //img
	    }
	    readNext() {
	        this.read(); //obj
	        this.read(); //material
	        this.read(); //particle;
	        var isGroup = this._byte.readBoolean();
	        if (isGroup) {
	            var length = this._byte.readInt();
	            for (var i = 0; i < length; i++) {
	                this.readItem(true);
	            }
	        }
	        else {
	            this.readItem(false);
	        }
	        this._fun();
	        this._fun = null;
	        this._byte = null;
	    }
	    readItem(isG) {
	        var types = this._byte.readInt();
	        var item = new GroupItem();
	        item.isGroup = isG;
	        if (isG) {
	            item.x = this._byte.readFloat();
	            item.y = this._byte.readFloat();
	            item.z = this._byte.readFloat();
	            item.scaleX = this._byte.readFloat();
	            item.scaleY = this._byte.readFloat();
	            item.scaleZ = this._byte.readFloat();
	            item.rotationX = this._byte.readFloat();
	            item.rotationY = this._byte.readFloat();
	            item.rotationZ = this._byte.readFloat();
	        }
	        if (types == BaseRes.PREFAB_TYPE) {
	            item.objUrl = this._byte.readUTF();
	            item.materialUrl = this._byte.readUTF();
	            if (this.version >= 4) {
	                item.materialInfoArr = this.readMaterialInfo();
	            }
	            item.types = BaseRes.PREFAB_TYPE;
	        }
	        else if (types == BaseRes.SCENE_PARTICLE_TYPE) {
	            item.particleUrl = this._byte.readUTF();
	            item.types = BaseRes.SCENE_PARTICLE_TYPE;
	        }
	        this.dataAry.push(item);
	    }
	    initReg() {
	        this._objDic = new Object;
	        this._materialDic = new Object;
	        this._particleDic = new Object;
	        for (var i = 0; i < this.dataAry.length; i++) {
	            var item = this.dataAry[i];
	            if (item.objUrl) {
	                this._objDic[Scene_data.fileRoot + item.objUrl] = true;
	            }
	            if (item.materialUrl) {
	                this._materialDic[Scene_data.fileRoot + item.materialUrl] = true;
	            }
	            if (item.particleUrl) {
	                this._particleDic[Scene_data.fileRoot + item.particleUrl] = true;
	            }
	        }
	        for (var key in this._objDic) {
	            ObjDataManager.getInstance().registerUrl(key);
	        }
	        for (var key in this._materialDic) {
	            MaterialManager.getInstance().registerUrl(key);
	        }
	        for (var key in this._particleDic) {
	            ParticleManager.getInstance().registerUrl(key);
	        }
	    }
	    destory() {
	        super.destory();
	        for (var key in this._objDic) {
	            ObjDataManager.getInstance().releaseUrl(key);
	        }
	        for (var key in this._materialDic) {
	            MaterialManager.getInstance().releaseUrl(key);
	        }
	        for (var key in this._particleDic) {
	            ParticleManager.getInstance().releaseUrl(key);
	        }
	        this.dataAry = null;
	        this._objDic = null;
	        this._particleDic = null;
	        this._materialDic = null;
	    }
	}
	class GroupItem extends Object3D {
	}

	class GroupDataManager extends ResGC {
	    constructor() {
	        super(...arguments);
	        this._loadDic = new Object;
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new GroupDataManager();
	        }
	        return this._instance;
	    }
	    getGroupData($url, $fun) {
	        if (this._dic[$url]) {
	            var gr = this._dic[$url];
	            gr.useNum++;
	            $fun(gr);
	            return;
	        }
	        if (this._loadDic[$url]) {
	            this._loadDic[$url].push($fun);
	            return;
	        }
	        this._loadDic[$url] = new Array;
	        this._loadDic[$url].push($fun);
	        var group = new GroupRes();
	        group.load($url, () => {
	            var ary = this._loadDic[$url];
	            for (var i = 0; i < ary.length; i++) {
	                var fun = ary[i];
	                fun(group);
	            }
	            this._dic[$url] = group;
	            delete this._loadDic[$url];
	            group.initReg();
	        });
	    }
	}

	class Display3dMovie extends Display3DSprite {
	    constructor() {
	        super();
	        this._completeState = 0;
	        /** 待机动作 */
	        this._defaultAction = "idle";
	        this._curentFrame = 0;
	        this._actionTime = 0;
	        this._fileScale = 1;
	        this._hasDestory = false;
	        /**正在播放的技能*/
	        this._isSinging = false;
	        this.meshVisible = true;
	        this._isLoaded = false;
	        this._nextScale = 1;
	        this.isPauseAnim = false;
	        this.curActionTime = 0;
	        this.isEnableAnimPlanarShadow = false;
	        this.locationDic = new Object;
	        this._animDic = new Object;
	        this._partDic = new Object;
	        this._partUrl = new Object;
	        this._preLoadActionDic = new Object;
	        this._waitLoadActionDic = new Object;
	        this.showCapsule = false;
	        this._enablePhysics = false;
	    }
	    get isSinging() {
	        return this._isSinging;
	    }
	    set isSinging(value) {
	        this._isSinging = value;
	        //console.log(" this._isSinging",this._isSinging)
	    }
	    getIsShadow() {
	        return this.isEnableAnimPlanarShadow;
	    }
	    get curentAction() {
	        return this._curentAction;
	    }
	    set curentAction(value) {
	        this._curentAction = value;
	    }
	    fixAstartData(pos) { }
	    get isLoaded() {
	        return this._isLoaded;
	    }
	    setRoleUrl(value) {
	        this.clearMesh();
	        MeshDataManager.getInstance().getMeshData(value, ($skinMesh) => {
	            if (this._hasDestory) {
	                $skinMesh.useNum--;
	                return;
	            }
	            this._skinMesh = $skinMesh;
	            this.fileScale = $skinMesh.fileScale;
	            if (this.onStage) {
	                this.addSkinMeshParticle();
	            }
	            this._animDic = $skinMesh.animDic;
	            this.onMeshLoaded();
	            this._isLoaded = true;
	        });
	    }
	    onMeshLoaded() {
	        this.dispatchEvent(new BaseEvent(BaseEvent.COMPLETE));
	    }
	    clearMesh() {
	        this._isLoaded = false;
	        this.removeSkinMeshParticle();
	        if (this._skinMesh) {
	            this._skinMesh.useNum--;
	        }
	        this._skinMesh = null;
	        this._animDic = new Object;
	    }
	    addSkinMeshParticle() {
	        if (!this._skinMesh) {
	            return;
	        }
	        var dicAry = new Array;
	        this._partDic["mesh"] = dicAry;
	        var meshAry = this._skinMesh.meshAry;
	        if (!meshAry) {
	            return;
	        }
	        for (var i = 0; i < meshAry.length; i++) {
	            var particleAry = meshAry[i].particleAry;
	            for (var j = 0; j < particleAry.length; j++) {
	                var bindPartcle = particleAry[j];
	                var particle;
	                particle = ParticleManager.getInstance().getParticleByte(Scene_data.fileRoot + bindPartcle.url);
	                if (!particle.sourceData) {
	                    console.log("particle.sourceData error");
	                }
	                particle.dynamic = true;
	                particle.bindSocket = bindPartcle.socketName;
	                dicAry.push(particle);
	                particle.bindTarget = this;
	                ParticleManager.getInstance().addParticle(particle);
	            }
	        }
	    }
	    removeSkinMeshParticle() {
	        var dicAry = this._partDic["mesh"];
	        if (!dicAry) {
	            return;
	        }
	        for (var i = 0; i < dicAry.length; i++) {
	            ParticleManager.getInstance().removeParticle(dicAry[i]);
	            dicAry[i].destory();
	        }
	        this._partDic["mesh"] = null;
	    }
	    roleResCom($roleRes, $batchNum) {
	        //this._roleRes = $roleRes;
	        //this._roleRes.useNum++;
	        //this._meshUrl = this._roleRes.roleUrl;
	        //MeshDataManager.getInstance().getMeshData(this._meshUrl, ($skinMesh: SkinMesh) => {
	        //    this._skinMesh = $skinMesh;
	        //    if ($batchNum != 1) {
	        //        this._skinMesh.type = 1;
	        //    }
	        //    for (var key in this._animDic) {
	        //        this.processAnimByMesh(this._animDic[key]);
	        //    }
	        //    $skinMesh.loadMaterial(($m: Material) => { this.loadMaterialCom($m) });
	        //    $skinMesh.loadParticle(this);
	        //    this.fileScale = $skinMesh.fileScale;
	        //}, $batchNum);
	        //var actionAry: Array<string> = this._roleRes.actionAry;
	        //for (var i: number = 0; i<actionAry.length;i++){
	        //    this.addAction(actionAry[i], this._roleRes.roleUrl + actionAry[i]);
	        //}
	    }
	    setMeshUrl(value, $batchNum = 1) {
	        this._meshUrl = Scene_data.fileRoot + value;
	        MeshDataManager.getInstance().getMeshData(this._meshUrl, ($skinMesh) => {
	            this._skinMesh = $skinMesh;
	            if ($batchNum != 1) {
	                this._skinMesh.type = 1;
	            }
	            for (var key in this._animDic) {
	                this.processAnimByMesh(this._animDic[key]);
	            }
	            $skinMesh.loadMaterial(($m) => { this.loadMaterialCom($m); });
	            //$skinMesh.loadParticle(this);
	            this.fileScale = $skinMesh.fileScale;
	        }, $batchNum);
	    }
	    set scale(value) {
	        this._nextScale = value;
	        this._scaleX = value * this._fileScale;
	        this._scaleY = value * this._fileScale;
	        this._scaleZ = value * this._fileScale;
	        this.updateMatrix();
	    }
	    get scale() {
	        return this._nextScale;
	    }
	    set fileScale(value) {
	        this._fileScale = value;
	        this._scaleX = this._nextScale * value;
	        this._scaleY = this._nextScale * value;
	        this._scaleZ = this._nextScale * value;
	        this.updateMatrix();
	    }
	    set shadow(value) {
	        if (value) {
	            if (!this._shadow) {
	                this._shadow = ShadowManager.getInstance().addShadow();
	            }
	        }
	        else {
	            if (this._shadow) {
	                ShadowManager.getInstance().removeShadow(this._shadow);
	            }
	        }
	    }
	    setShadowSize(value) {
	        if (this._shadow) {
	            this._shadow.size = value;
	        }
	    }
	    addStage() {
	        super.addStage();
	        this.addSkinMeshParticle();
	        if (this._shadow) {
	            this._shadow.visible = true;
	        }
	    }
	    removeStage() {
	        super.removeStage();
	        if (this._shadow) {
	            ShadowManager.getInstance().removeShadow(this._shadow);
	        }
	        for (var key in this._partDic) {
	            var ary = this._partDic[key];
	            for (var i = 0; i < ary.length; i++) {
	                if (ary[i] instanceof CombineParticle) {
	                    ParticleManager.getInstance().removeParticle(ary[i]);
	                }
	                else if (ary[i] instanceof Display3DSprite) {
	                    SceneManager.getInstance().removeSpriteDisplay(ary[i]);
	                }
	            }
	        }
	    }
	    loadMaterialCom($material) {
	        if ($material.lightProbe) {
	            this.lightProbe = true;
	        }
	    }
	    setCollision($radius, $height) {
	    }
	    applyVisible() {
	    }
	    removePart($key) {
	        var ary = this._partDic[$key];
	        if (!ary) {
	            return;
	        }
	        for (var i = 0; i < ary.length; i++) {
	            if (ary[i] instanceof CombineParticle) {
	                ParticleManager.getInstance().removeParticle(ary[i]);
	                ary[i].destory();
	            }
	            else if (ary[i] instanceof Display3DSprite) {
	                SceneManager.getInstance().removeSpriteDisplay(ary[i]);
	                ary[i].destory();
	            }
	        }
	        this._partDic[$key] = null;
	        this._partUrl[$key] = null;
	        delete this._partDic[$key];
	        delete this._partUrl[$key];
	    }
	    /**
	        部位，路径，类型 1为粒子 0为其他
	    */
	    addPart($key, $bindSocket, $url) {
	        if (this._partUrl[$key] == $url) { //如果相同则返回
	            return;
	        }
	        else if (this._partUrl[$key]) { //如果不同则先移除
	            this.removePart($key);
	        }
	        if (!this._partDic[$key]) {
	            this._partDic[$key] = new Array;
	        }
	        this._partUrl[$key] = $url;
	        var ary = this._partDic[$key];
	        GroupDataManager.getInstance().getGroupData(Scene_data.fileRoot + $url, (groupRes) => {
	            this.loadPartRes($bindSocket, groupRes, ary);
	        });
	        //var groupRes: GroupRes = new GroupRes;
	        //groupRes.load(Scene_data.fileRoot +  $url, () => { this.loadPartRes($bindSocket,groupRes,ary) });
	    }
	    loadPartRes($bindSocket, groupRes, ary) {
	        if (this._hasDestory) {
	            return;
	        }
	        for (var i = 0; i < groupRes.dataAry.length; i++) {
	            var item = groupRes.dataAry[i];
	            var posV3d;
	            var rotationV3d;
	            var scaleV3d;
	            if (item.isGroup) {
	                posV3d = new Vector3D(item.x, item.y, item.z);
	                rotationV3d = new Vector3D(item.rotationX, item.rotationY, item.rotationZ);
	                scaleV3d = new Vector3D(item.scaleX, item.scaleY, item.scaleZ);
	            }
	            if (item.types == BaseRes.SCENE_PARTICLE_TYPE) {
	                var particle = ParticleManager.getInstance().getParticleByte(Scene_data.fileRoot + item.particleUrl);
	                ary.push(particle);
	                particle.bindTarget = this;
	                particle.bindSocket = $bindSocket;
	                particle.dynamic = true;
	                ParticleManager.getInstance().addParticle(particle);
	                if (item.isGroup) {
	                    particle.setGroup(posV3d, rotationV3d, scaleV3d);
	                }
	            }
	            else if (item.types == BaseRes.PREFAB_TYPE) {
	                var display = new Display3DSprite();
	                display.setObjUrl(item.objUrl);
	                display.setMaterialUrl(item.materialUrl, item.materialInfoArr);
	                display.dynamic = true;
	                ary.push(display);
	                display.setBind(this, $bindSocket);
	                SceneManager.getInstance().addSpriteDisplay(display);
	                if (item.isGroup) {
	                    display.setGroup(posV3d, rotationV3d, scaleV3d);
	                }
	            }
	        }
	        this.applyVisible();
	    }
	    // public reset(): void
	    // {
	    //     for (var key in this._partDic) {
	    //         var ary: Array<any> = this._partDic[key];
	    //         for (var i: number = 0; i < ary.length; i++) {
	    //             if (ary[i] instanceof CombineParticle) {
	    //                 ParticleManager.getInstance().addParticle(<CombineParticle>ary[i])
	    //             } else if (ary[i] instanceof Display3DSprite) {
	    //                 SceneManager.getInstance().addDisplay(<Display3DSprite>ary[i])
	    //             }
	    //         }
	    //     }
	    // }
	    // private loadPartInfoCom($byte: ArrayBuffer, $bindSocket: string, ary: Array<any> ): void {
	    //     var byte: ByteArray = new ByteArray($byte);
	    //     var length: number = byte.readInt();
	    //     for (var i: number = 0; i < length; i++){
	    //         var types: number = byte.readInt();
	    //         var url: string = byte.readUTF();
	    //         var url2: string;
	    //         if (types == 1) {
	    //             url2 = byte.readUTF();
	    //         } 
	    //         var isGroup: boolean = byte.readBoolean();
	    //         var posV3d: Vector3D;
	    //         var rotationV3d: Vector3D;
	    //         var scaleV3d: Vector3D;
	    //         if (isGroup) {
	    //             posV3d = byte.readVector3D()
	    //             rotationV3d = byte.readVector3D()
	    //             scaleV3d = byte.readVector3D()
	    //         }
	    //         if (types == 0) {
	    //         } else if (types == 1){
	    //             var display: Display3DSprite = new Display3DSprite();
	    //             display.setObjUrl(url);
	    //             display.setMaterialUrl(url2);
	    //             ary.push(display);
	    //             display.setBind(this, $bindSocket);
	    //             SceneManager.getInstance().addDisplay(display);
	    //             if (isGroup){
	    //                 display.setGroup(posV3d, rotationV3d, scaleV3d);
	    //             }
	    //         }
	    //     }
	    // }
	    _getSocket(socketName, resultMatrix) {
	        resultMatrix.identity();
	        if (!this._skinMesh) {
	            //resultMatrix.appendTranslation(this._x,this._y,this._z);
	            resultMatrix.append(this.posMatrix);
	            return;
	        }
	        if (!this._skinMesh.boneSocketDic) {
	            console.log("this._skinMesh.boneSocketDic:", this._skinMesh.boneSocketDic, socketName);
	            resultMatrix.append(this.posMatrix);
	            return;
	        }
	        else if (!this._skinMesh.boneSocketDic[socketName]) {
	            if (socketName == "none") {
	                resultMatrix.appendTranslation(this._x, this._y, this._z);
	            }
	            else {
	                resultMatrix.append(this.posMatrix);
	            }
	            return;
	        }
	        var boneSocketData = this._skinMesh.boneSocketDic[socketName];
	        //if (!boneSocketData) {
	        //    resultMatrix.append(this.posMatrix);
	        //    return;
	        //}
	        var testmatix;
	        var index = boneSocketData.index;
	        testmatix = this.getFrameMatrix(index);
	        resultMatrix.appendScale(1 / this._scaleX, 1 / this._scaleY, 1 / this._scaleZ);
	        resultMatrix.appendRotation(boneSocketData.rotationX, Vector3D.X_AXIS);
	        resultMatrix.appendRotation(boneSocketData.rotationY, Vector3D.Y_AXIS);
	        resultMatrix.appendRotation(boneSocketData.rotationZ, Vector3D.Z_AXIS);
	        resultMatrix.appendTranslation(boneSocketData.x, boneSocketData.y, boneSocketData.z);
	        if (testmatix) {
	            resultMatrix.append(this._skinMesh.meshAry[this._skinMesh.meshAry.length - 1].bindPosInvertMatrixAry[index]);
	            resultMatrix.append(testmatix);
	        }
	    }
	    getSocket(socketName, resultMatrix) {
	        this._getSocket(socketName, resultMatrix);
	        resultMatrix.append(this.getOrgPosMatrix());
	    }
	    getSocketByScale(socketName, resultMatrix) {
	        this._getSocket(socketName, resultMatrix);
	        resultMatrix.append(this.posMatrix);
	    }
	    getSunType() {
	        return 0;
	    }
	    getFrameMatrix(index) {
	        if (this._animDic[this.curentAction]) {
	            var animData = this._animDic[this.curentAction];
	            if (this._curentFrame >= animData.matrixAry.length) {
	                return animData.matrixAry[0][index];
	            }
	            return animData.matrixAry[this._curentFrame][index];
	        }
	        else if (this._animDic[this._defaultAction]) {
	            var animData = this._animDic[this._defaultAction];
	            return animData.matrixAry[this._curentFrame][index];
	        }
	        return null;
	    }
	    addAction(name, url, needPerLoad = false) {
	        this._preLoadActionDic[name] = url;
	        if (name == this._defaultAction || name == this.curentAction) {
	            this.setAnimUrl(name, url);
	        }
	        else if (needPerLoad) {
	            this.setAnimUrl(name, url);
	        }
	    }
	    setAnimUrl(name, url) {
	        this._waitLoadActionDic[name] = true;
	        AnimManager.getInstance().getAnimData(url, ($animData) => {
	            this._animDic[name] = $animData;
	            this.processAnimByMesh($animData);
	            this._waitLoadActionDic[name] = false;
	        });
	    }
	    play($action, $completeState = 0, needFollow = true) {
	        //FpsMc.tipStr = "1" + $action + "," + this._curentAction;
	        if (this.curentAction == $action) {
	            return;
	        }
	        //FpsMc.tipStr = "2";
	        this.curentAction = $action;
	        this._completeState = $completeState;
	        this._actionTime = 0;
	        this.curActionTime = 0;
	        this.updateFrame(0);
	        //FpsMc.tipStr = "3";
	        if (this._animDic.hasOwnProperty($action)) {
	            //FpsMc.tipStr = "4";
	            return true;
	        }
	        else {
	            //FpsMc.tipStr = "5";
	            if (!this._waitLoadActionDic[$action] && this._preLoadActionDic[$action]) {
	                //FpsMc.tipStr = "6";
	                this.setAnimUrl($action, this._preLoadActionDic[$action]);
	            }
	            return false;
	        }
	    }
	    processAnimByMesh($animData) {
	        if (!this._skinMesh) {
	            return;
	        }
	        if ($animData.hasProcess) {
	            return;
	        }
	        for (var i = 0; i < $animData.matrixAry.length; i++) {
	            var frameAry = $animData.matrixAry[i];
	            for (var j = 0; j < frameAry.length; j++) {
	                frameAry[j].prepend(this._skinMesh.meshAry[0].bindPosMatrixAry[j]);
	            }
	        }
	        $animData.hasProcess = true;
	    }
	    update() {
	        if (!this._skinMesh) {
	            return;
	        }
	        if (this.lightProbe) {
	            this.resultSHVec = LightProbeManager.getInstance().getData(new Vector3D(this.x, this.y + 10, this.z));
	        }
	        // if(this.name == "老鹰"){
	        //  //console.log(this.name);  
	        // }
	        this.updateBind();
	        if (this.meshVisible) {
	            for (var i = 0; i < this._skinMesh.meshAry.length; i++) {
	                this.updateMaterialMesh(this._skinMesh.meshAry[i]);
	            }
	        }
	        if (this.showCapsule) {
	            this.updateShowCapsule();
	        }
	    }
	    get pauseAnim() {
	        return this.isPauseAnim;
	    }
	    set pauseAnim(v) {
	        this.isPauseAnim = v;
	    }
	    get animNormalizerTime() {
	        var actionKey;
	        if (this.curentAction && this._animDic[this.curentAction]) {
	            actionKey = this.curentAction;
	        }
	        else if (this._animDic[this._defaultAction]) {
	            actionKey = this._defaultAction;
	        }
	        else {
	            return -1;
	        }
	        var animData = this._animDic[actionKey];
	        let _curentFrame = Util.float2int(this.curActionTime / (Scene_data.frameTime * 2));
	        return _curentFrame / animData.matrixAry.length;
	    }
	    updateFrame(t) {
	        if (this.isPauseAnim)
	            return;
	        this._actionTime += t;
	        this.curActionTime += t;
	        var actionKey;
	        if (this.curentAction && this._animDic[this.curentAction]) {
	            actionKey = this.curentAction;
	        }
	        else if (this._animDic[this._defaultAction]) {
	            actionKey = this._defaultAction;
	        }
	        else {
	            return;
	        }
	        var animData = this._animDic[actionKey];
	        this._curentFrame = Util.float2int(this._actionTime / (Scene_data.frameTime * 2));
	        if (this._curentFrame >= animData.matrixAry.length) {
	            if (this._completeState == 0) {
	                this._actionTime = 0;
	                if (animData.inLoop)
	                    this.curActionTime = 0;
	                this._curentFrame = 0;
	            }
	            else if (this._completeState == 1) {
	                this._curentFrame = animData.matrixAry.length - 1;
	                this.dispatchEvent(new BaseEvent(BaseEvent.COMPLETE));
	            }
	            else if (this._completeState == 2) {
	                //this.play(this._defaultAction);
	                this._curentFrame = 0;
	                this._completeState = 0;
	                this.changeAction(this.curentAction);
	                this.dispatchEvent(new BaseEvent(BaseEvent.COMPLETE));
	            }
	            else if (this._completeState == 3) ;
	        }
	    }
	    changeAction($action) {
	        this.curentAction = this._defaultAction;
	    }
	    destory() {
	        super.destory();
	        if (this._skinMesh) {
	            this._skinMesh.useNum--;
	        }
	        for (var key in this._partDic) {
	            var ary = this._partDic[key];
	            for (var i = 0; i < ary.length; i++) {
	                if (ary[i] instanceof CombineParticle) {
	                    ary[i].destory();
	                }
	                else if (ary[i] instanceof Display3DSprite) {
	                    ary[i].destory();
	                }
	            }
	        }
	        this._partDic = null;
	        this._hasDestory = true;
	    }
	    updateShowCapsule() {
	        if (this.capsuleLineSprite) {
	            this.capsuleLineSprite.x = this.x;
	            this.capsuleLineSprite.y = this.y + this._capsule.radius;
	            this.capsuleLineSprite.z = this.z;
	            this.capsuleLineSprite.update();
	        }
	        else {
	            this.capsuleLineSprite = new LineDisplaySprite();
	            this.capsuleLineSprite.clear();
	            this.capsuleLineSprite.baseColor = new Vector3D(1, 0, 0, 1);
	            this.drawCylinder(this._capsule.radius, this._capsule.height);
	            this.drawBall(this._capsule.radius);
	            this.capsuleLineSprite.upToGpu();
	        }
	    }
	    drawBall($r) {
	        var radiusNum100 = $r;
	        var num = 12;
	        var p;
	        var m;
	        var lastPos;
	        var i;
	        var j;
	        var bm;
	        var bp;
	        for (j = 0; j <= num; j++) {
	            lastPos = null;
	            for (i = num / 2; i < num; i++) {
	                p = new Vector3D(radiusNum100, 0, 0);
	                m = new Matrix3D;
	                m.appendRotation((360 / num) * i, Vector3D.Z_AXIS);
	                p = m.transformVector(p);
	                bm = new Matrix3D;
	                bm.appendRotation((360 / num) * j, Vector3D.Y_AXIS);
	                p = bm.transformVector(p);
	                if (lastPos) {
	                    this.capsuleLineSprite.makeLineMode(lastPos, p);
	                }
	                lastPos = p.clone();
	            }
	        }
	        for (j = 1; j <= 4; j++) {
	            bm = new Matrix3D;
	            bm.appendRotation(j * -20, Vector3D.Z_AXIS);
	            bp = bm.transformVector(new Vector3D(radiusNum100, 0, 0));
	            lastPos = null;
	            for (i = 0; i < num; i++) {
	                p = bp.clone();
	                m = new Matrix3D;
	                m.appendRotation((360 / num) * i, Vector3D.Y_AXIS);
	                p = m.transformVector(p);
	                if (lastPos) {
	                    this.capsuleLineSprite.makeLineMode(lastPos, p);
	                }
	                if (i == num - 1) {
	                    this.capsuleLineSprite.makeLineMode(bp, p);
	                }
	                lastPos = p.clone();
	            }
	        }
	    }
	    drawCylinder($w, $h) {
	        var w = $w;
	        var h = $h;
	        var jindu = 12;
	        var lastA;
	        var lastB;
	        var i;
	        for (i = 0; i < jindu; i++) {
	            var a = new Vector3D(w, 0, 0);
	            var b = new Vector3D(w, +h, 0);
	            var m = new Matrix3D;
	            m.appendRotation(i * (360 / jindu), Vector3D.Y_AXIS);
	            var A = m.transformVector(a);
	            var B = m.transformVector(b);
	            this.capsuleLineSprite.makeLineMode(A, B);
	            //this.capsuleLineSprite.makeLineMode(A, new Vector3D(0, 0, 0))
	            this.capsuleLineSprite.makeLineMode(B, new Vector3D(0, +h, 0));
	            if (i == (jindu - 1)) {
	                this.capsuleLineSprite.makeLineMode(A, a);
	                this.capsuleLineSprite.makeLineMode(B, b);
	            }
	            if (lastA || lastB) {
	                this.capsuleLineSprite.makeLineMode(A, lastA);
	                this.capsuleLineSprite.makeLineMode(B, lastB);
	            }
	            lastA = A.clone();
	            lastB = B.clone();
	        }
	    }
	    setVcMatrix($mesh) {
	        //Scene_data.context3D.setVcMatrix4fv($mesh.material.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	        //Scene_data.context3D.setVcMatrix4fv($mesh.material.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	        Scene_data.context3D.setVpMatrix($mesh.material.shader, Scene_data.vpMatrix.m);
	        this.updateMatrix();
	        Scene_data.context3D.setVcMatrix4fv($mesh.material.shader, "posMatrix3D", this.posMatrix.m);
	        //Scene_data.context3D.setVcMatrix4fv($mesh.material.shader, "rotationMatrix3D", this._rotationMatrix.m);
	    }
	    setVa($mesh) {
	        // if ($mesh.compressBuffer) {
	        this.setVaCompress($mesh);
	        /*         } else {
	                    this.setVaIndependent($mesh);
	                } */
	    }
	    /*     public setVaIndependent($mesh: MeshData): void {
	            Scene_data.context3D.setVa(0, 3, $mesh.vertexBuffer);
	            Scene_data.context3D.setVa(1, 2, $mesh.uvBuffer);
	            Scene_data.context3D.setVa(2, 4, $mesh.boneIdBuffer);
	            Scene_data.context3D.setVa(3, 4, $mesh.boneWeightBuffer);
	    
	            if ($mesh.material.usePbr) {
	                Scene_data.context3D.setVa(4, 4, $mesh.normalsBuffer);
	                Scene_data.context3D.setVcMatrix4fv($mesh.material.shader, "rotationMatrix3D", this._rotationMatrix.m);
	                if ($mesh.material.useNormal) {
	                    Scene_data.context3D.setVa(5, 4, $mesh.tangentBuffer);
	                    Scene_data.context3D.setVa(6, 4, $mesh.bitangentBuffer);
	                }
	            } else {
	                if ($mesh.material.lightProbe || $mesh.material.directLight) {
	                    Scene_data.context3D.setVa(4, 4, $mesh.normalsBuffer);
	                    Scene_data.context3D.setVcMatrix4fv($mesh.material.shader, "rotationMatrix3D", this._rotationMatrix.m);
	                }
	            }
	    
	        } */
	    setVaCompress($mesh) {
	        /*         var tf: boolean = Scene_data.context3D.pushVa($mesh.vertexBuffer);
	                if (tf) {
	                    ////console.log('cccccc')
	                    return;
	                } */
	        $mesh._bufferState.bind();
	        // Scene_data.context3D.setVaOffset(0, 3, $mesh.stride, 0);
	        // Scene_data.context3D.setVaOffset(1, 2, $mesh.stride, $mesh.uvsOffsets);
	        // Scene_data.context3D.setVaOffset(2, 4, $mesh.stride, $mesh.boneIDOffsets);
	        // Scene_data.context3D.setVaOffset(3, 4, $mesh.stride, $mesh.boneWeightOffsets);
	        /*         if ($mesh.material.usePbr) {
	                    Scene_data.context3D.setVaOffset(4, 3, $mesh.stride, $mesh.normalsOffsets);
	                    Scene_data.context3D.setVcMatrix4fv($mesh.material.shader, "rotationMatrix3D", this._rotationMatrix.m);
	                    if ($mesh.material.useNormal) {
	                        Scene_data.context3D.setVaOffset(5, 3, $mesh.stride, $mesh.tangentsOffsets);
	                        Scene_data.context3D.setVaOffset(6, 3, $mesh.stride, $mesh.bitangentsOffsets);
	                    }
	                } else {
	                    if ($mesh.material.lightProbe || $mesh.material.directLight) {
	                        Scene_data.context3D.setVaOffset(4, 3, $mesh.stride, $mesh.normalsOffsets);
	                        Scene_data.context3D.setVcMatrix4fv($mesh.material.shader, "rotationMatrix3D", this._rotationMatrix.m);
	                    }
	                } */
	    }
	    clearVa() {
	        /*         Scene_data.context3D.clearVa(2);
	                Scene_data.context3D.clearVa(3);
	                Scene_data.context3D.clearVa(4);
	                Scene_data.context3D.clearVa(5);
	                Scene_data.context3D.clearVa(6); */
	    }
	    makeAnimPlanarShadowShader() {
	        var animPlanarShadowShader = new AnimPlanarShadowShader();
	        if (!animPlanarShadowShader.encode()) {
	            console.log("make anim planar shadow shader failed !");
	        }
	        return animPlanarShadowShader;
	    }
	    set enableAnimPlaranShadow(v) {
	        this.isEnableAnimPlanarShadow = v;
	    }
	    //Plannar shadow pass*/
	    renderPlanarShadow($mesh) {
	        Scene_data.context3D.setProgram(PlanarShadowShader.getInst().program);
	        Scene_data.context3D.setVcMatrix4fv(PlanarShadowShader.getInst(), "uMProjCameraMatrix", new Float32Array(Scene_data.vpMatrix.m));
	        let posMatrix = new Matrix3D();
	        posMatrix.identity();
	        posMatrix.appendScale(this._scaleX * SceneManager.scaleWorld.x, this._scaleY * SceneManager.scaleWorld.y, this._scaleZ * SceneManager.scaleWorld.z);
	        posMatrix.appendRotation(-45, Vector3D.Y_AXIS);
	        posMatrix.appendTranslation(this._x * SceneManager.scaleWorld.x, this._y * SceneManager.scaleWorld.x, this._z * SceneManager.scaleWorld.x);
	        Scene_data.context3D.setVcMatrix4fv(PlanarShadowShader.getInst(), "uMMatrix", posMatrix.m);
	        Scene_data.context3D.setVc3fv(PlanarShadowShader.getInst(), "uLightLocation", PlanarShadowShader.getLightPosArry(this.posMatrix));
	        this.setVa($mesh);
	        Scene_data.context3D.drawCallL3d($mesh.treNum);
	        $mesh._bufferState.unBind();
	    }
	    isRenderAnimPlanarShadow() {
	        if (this.bindTarget && this.bindTarget.getIsShadow())
	            return true;
	        return this.isEnableAnimPlanarShadow;
	    }
	    /*Anim Plannar Shadow Pass*/
	    renderAnimPlanarShadow($mesh) {
	        if (!this.isRenderAnimPlanarShadow())
	            return;
	        let oldProgram = $mesh.material.program;
	        let oldShader = $mesh.material.shader;
	        if (!Display3dMovie.animPlanarShadowShader) {
	            Display3dMovie.animPlanarShadowShader = this.makeAnimPlanarShadowShader();
	        }
	        $mesh.material.shader = Display3dMovie.animPlanarShadowShader;
	        $mesh.material.program = Display3dMovie.animPlanarShadowShader.program;
	        Scene_data.context3D.setProgram($mesh.material.program);
	        Scene_data.context3D.cullFaceBack(false);
	        this.setMeshVc($mesh);
	        this.setMaterialVc($mesh.material, $mesh.materialParam);
	        Scene_data.context3D.setVcMatrix4fv(Display3dMovie.animPlanarShadowShader, "uMProjCameraMatrix", new Float32Array(Scene_data.vpMatrix.m));
	        this.updateMatrix();
	        Scene_data.context3D.setVcMatrix4fv(Display3dMovie.animPlanarShadowShader, "uMMatrix", this.posMatrix.m);
	        Scene_data.context3D.setVc3fv(Display3dMovie.animPlanarShadowShader, "uLightLocation", PlanarShadowShader.getLightPosArry(this.posMatrix));
	        this.setVa($mesh);
	        Scene_data.context3D.drawCallL3d($mesh.treNum);
	        $mesh._bufferState.unBind();
	        $mesh.material.program = oldProgram;
	        $mesh.material.shader = oldShader;
	    }
	    updateMaterialMesh($mesh) {
	        if (!$mesh.material) {
	            return;
	        }
	        Scene_data.context3D.setProgram($mesh.material.program);
	        // Scene_data.context3D.cullFaceBack($mesh.material.backCull);
	        Scene_data.context3D.cullFaceBack(false);
	        Scene_data.context3D.setBlendParticleFactors($mesh.material.blendMode);
	        // Scene_data.context3D.setBlendParticleFactors(-1);
	        this.setVcMatrix($mesh);
	        //this.setBaseMaterialVc($mesh.material);
	        this.setMaterialVc($mesh.material, $mesh.materialParam);
	        ////console.log($mesh.material.fcData);
	        this.setMaterialTexture($mesh.material, $mesh.materialParam);
	        this.setVa($mesh);
	        //this.setLightProbeVc($mesh.material);
	        this.setDirectLight($mesh.material);
	        this.setMeshVc($mesh);
	        Scene_data.context3D.drawCallL3d($mesh.treNum);
	        $mesh._bufferState.unBind();
	        //this.renderAnimPlanarShadow($mesh);
	    }
	    renderAnimPlanarShadowAll() {
	        if (this.meshVisible && this._skinMesh && this._skinMesh.meshAry) {
	            for (var i = 0; i < this._skinMesh.meshAry.length; i++) {
	                this.renderAnimPlanarShadow(this._skinMesh.meshAry[i]);
	            }
	        }
	    }
	    setLightProbeVc($material) {
	        if ($material.lightProbe) {
	            for (var i = 0; i < this.resultSHVec.length; i++) {
	                Scene_data.context3D.setVc3fv($material.shader, "sh[" + i + "]", [this.resultSHVec[i].x, this.resultSHVec[i].y, this.resultSHVec[i].z]);
	            }
	        }
	    }
	    setMeshVc($mesh) {
	        var animData;
	        if (this._animDic[this.curentAction]) {
	            animData = this._animDic[this.curentAction];
	        }
	        else if (this._animDic[this._defaultAction]) {
	            animData = this._animDic[this._defaultAction];
	        }
	        else {
	            return;
	        }
	        var $dualQuatFrame = animData.getBoneQPAryByMesh($mesh)[$mesh.uid][this._curentFrame];
	        if (!$dualQuatFrame) {
	            return;
	        }
	        Scene_data.context3D.setVc4fv($mesh.material.shader, "boneQ", $dualQuatFrame.quat); //旋转
	        Scene_data.context3D.setVc3fv($mesh.material.shader, "boneD", $dualQuatFrame.pos); //所有的位移
	    }
	    setPos($v3d) {
	        ////console.log($v3d);
	        super.setPos($v3d);
	        if (this._shadow) {
	            this._shadow.x = $v3d.x;
	            this._shadow.y = $v3d.y + 8;
	            this._shadow.z = $v3d.z;
	        }
	    }
	    set x(value) {
	        this._x = value;
	        this.updateMatrix();
	        if (this._shadow) {
	            this._shadow.x = value;
	        }
	        this.changePos();
	    }
	    get x() {
	        return this._x;
	    }
	    set y(value) {
	        this._y = value;
	        this.updateMatrix();
	        if (this._shadow) {
	            this._shadow.y = value;
	        }
	        this.changePos();
	    }
	    get y() {
	        return this._y;
	    }
	    set z(value) {
	        this._z = value;
	        this.updateMatrix();
	        if (this._shadow) {
	            this._shadow.z = value;
	        }
	        this.changePos();
	    }
	    get z() {
	        return this._z;
	    }
	    changePos() {
	    }
	}

	class SkillEffect extends SkillKey {
	    addToRender() {
	        super.addToRender();
	        this.particle.addEventListener(BaseEvent.COMPLETE, this.onPlayCom, this);
	    }
	    onPlayCom(event = null) {
	        this.particle.removeEventListener(BaseEvent.COMPLETE, this.onPlayCom, this);
	        ParticleManager.getInstance().removeParticle(this.particle);
	        this.removeCallFun(this);
	    }
	}

	class SkillBugBind {
	    getIsShadow() {
	        return false;
	    }
	    getSocket(socketName, resultMatrix) {
	        this.bindMatrix.clone(resultMatrix);
	    }
	    getSunType() {
	        return 1;
	    }
	}
	class SkillFixEffect extends SkillEffect {
	    setInfo(obj) {
	        super.setInfo(obj);
	        var data = obj;
	        this.pos = data.pos;
	        this.rotation = data.rotation;
	        this.hasSocket = data.hasSocket;
	        this.socket = data.socket;
	    }
	    addToRender() {
	        super.addToRender();
	        if (this.outPos) {
	            this.particle.x = this.outPos.x;
	            this.particle.y = this.outPos.y;
	            this.particle.z = this.outPos.z;
	            this.particle.rotationX = this.rotation.x;
	            this.particle.rotationY = this.rotation.y + this.active.rotationY;
	            this.particle.rotationZ = this.rotation.z;
	            this.particle.bindTarget = null;
	        }
	        else if (this.hasSocket) {
	            var targetActive = this.active;
	            this.particle.bindTarget = (targetActive);
	            this.particle.bindSocket = this.socket;
	        }
	        else {
	            var ma = new Matrix3D;
	            ma.appendRotation(this.active.rotationY, Vector3D.Y_AXIS);
	            var v3d = ma.transformVector(this.pos);
	            v3d.x += this.active.x;
	            v3d.y += this.active.y;
	            v3d.z += this.active.z;
	            /* //原来小刘写的方法，在有编辑器中因为角色角度为0,当游戏场景时就会有错。
	            this.particle.x = v3d.x;
	            this.particle.y = v3d.y;
	            this.particle.z = v3d.z;

	            this.particle.rotationX = this.rotation.x;
	            this.particle.rotationY = this.rotation.y +this.active.rotationY
	            this.particle.rotationZ = this.rotation.z;

	            */
	            // 当绑定对象有三个轴变化时有异常，需
	            var $SkillBugBind = new SkillBugBind();
	            $SkillBugBind.bindMatrix = new Matrix3D;
	            $SkillBugBind.bindMatrix.appendRotation(this.rotation.x, Vector3D.X_AXIS);
	            $SkillBugBind.bindMatrix.appendRotation(this.rotation.y, Vector3D.Y_AXIS);
	            $SkillBugBind.bindMatrix.appendRotation(this.rotation.z, Vector3D.Z_AXIS);
	            $SkillBugBind.bindMatrix.appendRotation(this.active.rotationY, Vector3D.Y_AXIS);
	            $SkillBugBind.bindMatrix.appendTranslation(v3d.x, v3d.y, v3d.z);
	            this.particle.bindTarget = $SkillBugBind;
	        }
	    }
	}

	class SkillMulTrajectory extends SkillTrajectory {
	    update(t) {
	        this.pathMul.update(t);
	    }
	    getSunType() {
	        return 1;
	    }
	    addToRender() {
	        if (!this.particle) {
	            return;
	        }
	        this.particle.reset();
	        ParticleManager.getInstance().addParticle(this.particle);
	        if (!this.currentPosList) {
	            this.currentPosList = new Array;
	            for (var i = 0; i < this.activeList.length; i++) {
	                this.currentPosList.push(new Vector3D(this.activeList[i].x, this.activeList[i].y + 10, this.activeList[i].z + 5));
	            }
	            this.pathMul.setInitCurrentPos(this.currentPosList);
	        }
	        else {
	            for (var i = 0; i < this.activeList.length; i++) {
	                this.currentPosList[i].setTo(this.activeList[i].x, this.activeList[i].y + 10, this.activeList[i].z + 5);
	                this.currentPosList[i].w = 0;
	            }
	        }
	        //this.particle.setMulPos(this.currentPosList);
	        this.pathMul.add();
	        this.particle.setMulPos(this.pathMul.resultAry);
	    }
	    setMulPlayData($activeList, $target, $removeCallFun, types = 0) {
	        this.activeList = $activeList;
	        this.active = this.activeList[0];
	        this.target = $target;
	        this.removeCallFun = $removeCallFun;
	        this._currentPos.setTo(0, 0, 0);
	        this.rotationMatrix.identity();
	        this._socketMaxrix.identity();
	        this._currentTargetPos.setTo(0, 0, 0);
	        if (!this.pathMul) {
	            this.pathMul = PathManager.getNewPath(types);
	            this.pathMul.setData(this, () => { this.reset(); }, this._currentPos, this.rotationMatrix, this._currentTargetPos);
	            this.pathMul.speed = this.data.speed;
	        }
	        this.pathMul.reset();
	    }
	    getMulSocket(ary) {
	        if (ary) {
	            this.pathMul.applyData(ary);
	        }
	    }
	}

	class SoundManager {
	    constructor() {
	        this.init = false;
	        this._volume = 1.0;
	        this._skillSoundDic = new Object;
	        this._skillVolume = 1.0;
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new SoundManager();
	        }
	        return this._instance;
	    }
	    playSound() {
	        this.initSound();
	        this.audio.play();
	    }
	    initSound() {
	        if (this.init) {
	            return;
	        }
	        this.audio = new Audio(Scene_data.fileRoot + "sound/sound_3521.mp3");
	        this.audio.loop = true;
	        this.audio.volume = this._volume;
	        this.audio.play();
	        this.init = true;
	    }
	    stopSound() {
	        if (this.audio) {
	            this.audio.pause();
	        }
	    }
	    setVolume(val) {
	        this._volume = val;
	        if (this._volume > 0) {
	            this.playSound();
	        }
	        else {
	            this.stopSound();
	        }
	        if (this.audio) {
	            this.audio.volume = this._volume;
	        }
	    }
	    setSkillVolume(val) {
	        this._skillVolume = val;
	        for (var key in this._skillSoundDic) {
	            this._skillSoundDic[key].volume = this._skillVolume;
	        }
	    }
	    playSkillSound($name) {
	        ////console.log($name);
	        if (this._skillVolume <= 0) {
	            return;
	        }
	        if (this._skillSoundDic[$name]) {
	            this._skillSoundDic[$name].play();
	        }
	        else {
	            var audio = new Audio(Scene_data.fileRoot + "skill/sound/" + $name);
	            audio.loop = false;
	            audio.volume = this._skillVolume;
	            audio.play();
	            this._skillSoundDic[$name] = audio;
	        }
	    }
	}

	class Skill extends ResCount {
	    constructor() {
	        super();
	        this.isDeath = true;
	        this.src = false;
	        this.time = 0;
	        this.targetFlag = 0;
	        this.targetShockFlag = 0;
	        this.needSound = false;
	        this.hasDestory = false;
	        this.actionEnd = false;
	    }
	    setData($data, $skillData) {
	        if (this.hasDestory) {
	            return;
	        }
	        this.skillVo = new SkillVo();
	        this.skillVo.setData($data);
	        this.setKeyAry();
	        this.trajectoryAry = new Array;
	        this._skillData = $skillData;
	    }
	    getBloodTime() {
	        if (this.skillVo) {
	            return this.skillVo.bloodTime;
	        }
	        else {
	            return SkillVo.defaultBloodTime;
	        }
	    }
	    play() {
	        if (!this.skillVo) {
	            this.skillComplete();
	            return;
	        }
	        if (this.active && this.active instanceof Display3dMovie) {
	            var $movie3d = this.active;
	            $movie3d.play(this.skillVo.action, this.actionEnd ? 1 : 2, false);
	        }
	    }
	    setKeyAry() {
	        this.keyAry = new Array;
	        if (this.skillVo.types == SkillType.FixEffect) {
	            for (var i = 0; i < this.skillVo.keyAry.length; i++) {
	                var keySkill = new SkillFixEffect();
	                keySkill.setInfo(this.skillVo.keyAry[i]);
	                keySkill.removeCallFun = ($key) => { this.removeKey($key); };
	                keySkill.active = this.active;
	                this.keyAry.push(keySkill);
	            }
	        }
	        else if (this.skillVo.types == SkillType.TrajectoryDynamicTarget || this.skillVo.types == SkillType.TrajectoryDynamicPoint) {
	            for (var i = 0; i < this.skillVo.keyAry.length; i++) {
	                var trajectory;
	                var tkv = (this.skillVo.keyAry[i]);
	                if (tkv.multype == 1) {
	                    trajectory = new SkillMulTrajectory();
	                }
	                else {
	                    trajectory = new SkillTrajectory();
	                }
	                trajectory.setInfo(this.skillVo.keyAry[i]);
	                this.keyAry.push(trajectory);
	            }
	        }
	    }
	    removeKey($key) {
	        this.completeNum++;
	        if (this.completeNum == this.keyAry.length) {
	            //    //console.log("播放结束");
	            this.skillComplete();
	        }
	    }
	    /**强制移除技能 */
	    removeSkillForce() {
	        // if(this.key == "skill/jichu_1_byte.txtm_skill_04"){
	        //     SkillManager.getInstance().fengbaonum--;
	        //     console.log("移除技能风暴 " + SkillManager.getInstance().fengbaonum);
	        // }        
	        if (this.keyAry) {
	            for (var i = 0; i < this.keyAry.length; i++) {
	                this.keyAry[i].reset();
	            }
	        }
	        this.skillComplete();
	        this.reset();
	    }
	    skillComplete() {
	        SkillManager.getInstance().removeSkill(this);
	        this.isDeath = true;
	        if (this.completeFun) {
	            this.completeFun();
	        }
	        this.idleTime = 0;
	    }
	    reset() {
	        this.time = 0;
	        this.completeNum = 0;
	        this.active = null;
	        this.completeFun = null;
	        this.targetFlag = 0;
	        this.targetShockFlag = 0;
	        this.soundPlay = false;
	        this.needSound = false;
	    }
	    update(t) {
	        this.time += t;
	        if (this.time > Skill.MaxTime) {
	            //console.log("超时结束");
	            this.skillComplete();
	        }
	        this.getKeyTarget();
	        this.getShockTarget();
	        this.updateTrajector(t);
	    }
	    updateTrajector(t) {
	        for (var i = 0; i < this.trajectoryAry.length; i++) {
	            this.trajectoryAry[i].update(t);
	        }
	    }
	    getKeyTarget() {
	        if (!this.keyAry) {
	            return;
	        }
	        for (var i = this.targetFlag; i < this.keyAry.length; i++) {
	            if (this.keyAry[i].time < this.time) {
	                this.keyAry[i].addToRender();
	                if (this.skillVo.types == SkillType.TrajectoryDynamicTarget || this.skillVo.types == SkillType.TrajectoryDynamicPoint) {
	                    var ss = this.keyAry[i];
	                    this.trajectoryAry.push(ss);
	                }
	                i++;
	                this.targetFlag = i;
	            }
	            else {
	                break;
	            }
	        }
	        this.getSound();
	    }
	    getShockTarget() {
	        if (!this.skillVo.shockAry || !this.needSound) {
	            return;
	        }
	        for (var i = this.targetShockFlag; i < this.skillVo.shockAry.length; i++) {
	            if (this.skillVo.shockAry[i].time < this.time) {
	                //震动
	                ShockUtil.getInstance().shock(this.skillVo.shockAry[i].lasttime, this.skillVo.shockAry[i].amp);
	                i++;
	                this.targetShockFlag = i;
	            }
	            else {
	                break;
	            }
	        }
	        //this.getSound();
	    }
	    getSound() {
	        if (!this.skillVo.sound || this.soundPlay || !this.needSound) {
	            return;
	        }
	        if (this.skillVo.sound.frame < this.time) {
	            SoundManager.getInstance().playSkillSound(this.skillVo.sound.url);
	            this.soundPlay = true;
	        }
	    }
	    configFixEffect($active, $completeFun = null, $posObj = null) {
	        this.active = $active;
	        this.completeFun = $completeFun;
	        if (!this.keyAry) {
	            return;
	        }
	        for (var i = 0; i < this.keyAry.length; i++) {
	            if (this.skillVo.types != SkillType.FixEffect) {
	                continue;
	            }
	            var skillFixEffect = this.keyAry[i];
	            skillFixEffect.active = $active;
	            if ($posObj && $posObj.length) {
	                if (i > ($posObj.length - 1)) {
	                    skillFixEffect.outPos = $posObj[$posObj.length - 1];
	                }
	                else {
	                    skillFixEffect.outPos = $posObj[i];
	                }
	            }
	            else {
	                skillFixEffect.outPos = null;
	            }
	        }
	    }
	    configTrajectory($active, $target, $completeFun = null, types = 0, $bloodFun = null) {
	        this.active = $active;
	        this.completeFun = $completeFun;
	        this.completeNum = 0;
	        if (!this.keyAry) {
	            return;
	        }
	        for (var i = 0; i < this.keyAry.length; i++) {
	            if (!(this.skillVo.types == SkillType.TrajectoryDynamicTarget || this.skillVo.types == SkillType.TrajectoryDynamicPoint)) {
	                continue;
	            }
	            var skillTrajector = this.keyAry[i];
	            skillTrajector.setPlayData($active, $target, ($skilltra) => { this.removeTrajectory($skilltra); }, types, (i == 0 ? $bloodFun : null));
	        }
	    }
	    configMulTrajectory($activeList, $active, $target, $completeFun = null) {
	        this.active = $active;
	        this.completeFun = $completeFun;
	        this.completeNum = 0;
	        if (!this.keyAry) {
	            return;
	        }
	        for (var i = 0; i < this.keyAry.length; i++) {
	            if (this.skillVo.types != SkillType.TrajectoryDynamicTarget) {
	                continue;
	            }
	            var skillTrajector = this.keyAry[i];
	            skillTrajector.setMulPlayData($activeList, $target, ($skilltra) => { this.removeTrajectory($skilltra); }, 2);
	        }
	    }
	    removeTrajectory($skilltra) {
	        var index = this.trajectoryAry.indexOf($skilltra);
	        if (index != -1) {
	            this.trajectoryAry.splice(index, 1);
	        }
	        this.completeNum++;
	        if (this.completeNum == this.keyAry.length) {
	            // //console.log("播放结束");
	            this.skillComplete();
	        }
	    }
	    destory() {
	        this.skillVo = null;
	        this.name = null;
	        if (this.keyAry) {
	            for (var i = 0; i < this.keyAry.length; i++) {
	                this.keyAry[i].destory();
	            }
	            this.keyAry.length = 0;
	            this.keyAry = null;
	        }
	        this.active = null;
	        this.completeFun = null;
	        if (this.trajectoryAry) {
	            for (var i = 0; i < this.trajectoryAry.length; i++) {
	                this.trajectoryAry[i].destory();
	            }
	            this.trajectoryAry.length = 0;
	            this.trajectoryAry = null;
	        }
	        if (this._skillData) {
	            this._skillData.useNum--;
	        }
	        this._skillData = null;
	        this.hasDestory = true;
	    }
	}
	Skill.MaxTime = 1000 * 5;

	class SkillData extends ResCount {
	    constructor() {
	        super(...arguments);
	        this.srcList = new Array();
	    }
	    addSrcSkill($skill) {
	        this.srcList.push($skill);
	    }
	    destory() {
	        for (var i = 0; i < this.srcList.length; i++) {
	            this.srcList[i].destory();
	            SkillManager.getInstance().gcSkill(this.srcList[i]);
	        }
	    }
	    testDestory() {
	        for (var i = 0; i < this.srcList.length; i++) {
	            if (!(this.srcList[i].isDeath && this.srcList[i].idleTime >= ResCount.GCTime)) {
	                return false;
	            }
	        }
	        return true;
	    }
	}

	class SkillManager extends ResGC {
	    constructor() {
	        //this._dic = new Object();
	        super();
	        this._time = 0;
	        this._skillDic = new Object;
	        this._loadDic = new Object;
	        this._skillAry = new Array;
	        this._preLoadDic = new Object;
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new SkillManager();
	        }
	        return this._instance;
	    }
	    update() {
	        var _tempTime = TimeUtil.getTimer();
	        var t = _tempTime - this._time;
	        for (var i = 0; i < this._skillAry.length; i++) {
	            this._skillAry[i].update(t);
	        }
	        this._time = _tempTime;
	    }
	    preLoadSkill($url) {
	        if (this._dic[$url] || this._preLoadDic[$url]) {
	            return;
	        }
	        ResManager.getInstance().loadSkillRes(Scene_data.fileRoot + $url, ($skillRes) => {
	            var skillData = new SkillData();
	            skillData.data = $skillRes.data;
	            skillData.useNum++;
	            this._dic[$url] = skillData;
	            this.addSrc($url, skillData);
	        });
	        this._preLoadDic[$url] = true;
	    }
	    //public fengbaonum:number = 0;
	    getSkill($url, $name, $callback = null) {
	        var skill;
	        var key = $url + $name;
	        // if(key == "skill/jichu_1_byte.txtm_skill_04"){
	        //     console.log("添加技能风暴");
	        //     this.fengbaonum++;
	        // }
	        var ary = this._skillDic[key];
	        if (ary) {
	            for (var i = 0; i < ary.length; i++) {
	                skill = ary[i];
	                if (skill.isDeath && skill.useNum == 0) {
	                    skill.reset();
	                    skill.isDeath = false;
	                    return skill;
	                }
	            }
	        }
	        skill = new Skill();
	        skill.name = $name;
	        skill.isDeath = false;
	        if (!this._skillDic[key]) {
	            this._skillDic[key] = new Array;
	        }
	        this._skillDic[key].push(skill);
	        if (this._dic[$url]) {
	            skill.setData(this._dic[$url].data[skill.name], this._dic[$url]);
	            skill.key = key;
	            this._dic[$url].useNum++;
	            return skill;
	        }
	        if (this._loadDic[$url]) {
	            var obj = new Object;
	            obj.name = $name;
	            obj.skill = skill;
	            obj.callback = $callback;
	            this._loadDic[$url].push(obj);
	            return skill;
	        }
	        this._loadDic[$url] = new Array;
	        var obj = new Object;
	        obj.name = $name;
	        obj.skill = skill;
	        obj.callback = $callback;
	        this._loadDic[$url].push(obj);
	        ResManager.getInstance().loadSkillRes(Scene_data.fileRoot + $url, ($skillRes) => {
	            this.loadSkillCom($url, $skillRes);
	        });
	        return skill;
	    }
	    loadSkillCom($url, $skillRes) {
	        var skillData = new SkillData();
	        skillData.data = $skillRes.data;
	        for (var i = 0; i < this._loadDic[$url].length; i++) {
	            var obj = this._loadDic[$url][i];
	            if (!obj.skill.hasDestory) {
	                obj.skill.setData(skillData.data[obj.name], skillData);
	                obj.skill.key = $url + obj.name;
	                skillData.useNum++;
	            }
	        }
	        this._dic[$url] = skillData;
	        this.addSrc($url, skillData);
	        for (var i = 0; i < this._loadDic[$url].length; i++) {
	            var obj = this._loadDic[$url][i];
	            if (obj.callback) {
	                obj.callback();
	            }
	        }
	        this._loadDic[$url].length = 0;
	        this._loadDic[$url] = null;
	    }
	    addSrc($url, skillData) {
	        for (var key in skillData.data) {
	            var skill = new Skill();
	            skill.name = key;
	            skill.isDeath = true;
	            skill.src = true;
	            skill.setData(skillData.data[key], skillData);
	            skillData.addSrcSkill(skill);
	            //skillData.useNum++;
	            var dkey = $url + key;
	            if (!this._skillDic[dkey]) {
	                this._skillDic[dkey] = new Array;
	            }
	            this._skillDic[dkey].push(skill);
	        }
	    }
	    playSkill($skill) {
	        this._skillAry.push($skill);
	        $skill.play();
	    }
	    removeSkill($skill) {
	        var index = this._skillAry.indexOf($skill);
	        if (index != -1) {
	            this._skillAry.splice(index, 1);
	        }
	    }
	    gcSkill(skill) {
	        for (var key in this._skillDic) {
	            var ary = this._skillDic[key];
	            var idx = ary.indexOf(skill);
	            if (idx != -1) {
	                ary.splice(idx, 1);
	            }
	        }
	    }
	    gc() {
	        //super.gc();
	        for (var key in this._dic) {
	            var rc = this._dic[key];
	            if (rc.useNum <= 0) {
	                rc.idleTime++;
	                if (rc.idleTime >= ResCount.GCTime && rc.testDestory()) {
	                    //console.log("清理 -" + key);
	                    rc.destory();
	                    delete this._dic[key];
	                }
	            }
	        }
	        for (var key in this._skillDic) {
	            var ary = this._skillDic[key];
	            for (var i = ary.length - 1; i >= 0; i--) {
	                if (ary[i].isDeath && ary[i].useNum <= 0) {
	                    ary[i].idleTime++;
	                    if (ary[i].idleTime >= ResCount.GCTime) {
	                        if (!ary[i].src) {
	                            ary[i].destory();
	                            ary.splice(i, 1);
	                        }
	                    }
	                }
	            }
	            if (ary.length == 0) {
	                //console.log("清理 -" + key);
	                delete this._skillDic[key];
	            }
	        }
	    }
	}
	class ShockUtil {
	    constructor() {
	        this.upFun = ($d) => {
	            this.update($d);
	        };
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new ShockUtil();
	        }
	        return this._instance;
	    }
	    update($dtime) {
	        this.ctime += $dtime;
	        if (this.ctime > this.time) {
	            TimeUtil.removeFrameTick(this.upFun);
	            Scene_data.cam3D.offset.setTo(0, 0, 0);
	            return;
	        }
	        var ranX = (Math.random() - 0.5) * this.amp;
	        var ranY = (Math.random() - 0.5) * this.amp;
	        var ranZ = (Math.random() - 0.5) * this.amp;
	        Scene_data.cam3D.offset.setTo(ranX, ranY, ranZ);
	    }
	    shock(time, amp) {
	        this.time = time;
	        this.ctime = 0;
	        this.amp = amp;
	        TimeUtil.addFrameTick(this.upFun);
	    }
	}

	class OverrideSceneManager extends SceneManager {
	    constructor() {
	        super();
	    }
	    static initConfig() {
	        SceneManager._instance = new OverrideSceneManager;
	    }
	    update() {
	        MathClass.getCamView(Scene_data.cam3D, Scene_data.focus3D); //一定要角色帧渲染后再重置镜头矩阵
	        Scene_data.context3D._contextSetTest.clear();
	        if (isNaN(this._time)) {
	            this._time = TimeUtil.getTimer();
	        }
	        this.updateMovieFrame();
	        if (this._ready) {
	            ParticleManager.getInstance().updateTime();
	            SkillManager.getInstance().update();
	            if (this.render) {
	                Scene_data.context3D.cullFaceBack(false);
	                Scene_data.context3D.cullFaceBack(true);
	                Scene_data.context3D.cullFaceBack(true);
	                Scene_data.context3D.setWriteDepth(true);
	                Scene_data.context3D.setDepthTest(true);
	                this.updateStaticDiplay();
	                this.updateSpriteDisplay();
	                this.updateMovieDisplay();
	                Scene_data.context3D.setWriteDepth(false);
	                ParticleManager.getInstance().update();
	                Scene_data.context3D.setBlendParticleFactors(0);
	                Scene_data.context3D.setWriteDepth(true);
	            }
	            Scene_data.context3D.setDepthTest(false);
	        }
	    }
	}

	class LayaOverride2dParticleManager extends ParticleManager {
	    constructor() {
	        super();
	    }
	    getParticleByte($url) {
	        $url = $url.replace("_byte.txt", ".txt");
	        $url = $url.replace(".txt", "_byte.txt");
	        var combineParticle = new CombineParticle();
	        var url = $url;
	        if (ParticleManager.getInstance()._dic[url]) {
	            var baseData = ParticleManager.getInstance()._dic[url];
	            combineParticle = baseData.getCombineParticle();
	        }
	        else {
	            LoadManager.getInstance().load(url, LoadManager.BYTE_TYPE, ($byte) => {
	                var byte = new Pan3dByteArray($byte);
	                combineParticle.setDataByte(byte);
	            });
	        }
	        combineParticle.url = url;
	        return combineParticle;
	    }
	    registerUrl($url) {
	        $url = $url.replace("_byte.txt", ".txt");
	        $url = $url.replace(".txt", "_byte.txt");
	        if (ParticleManager.getInstance()._dic[$url]) {
	            var baseData = ParticleManager.getInstance()._dic[$url];
	            baseData.useNum++;
	        }
	    }
	    releaseUrl($url) {
	        $url = $url.replace("_byte.txt", ".txt");
	        $url = $url.replace(".txt", "_byte.txt");
	        if (ParticleManager.getInstance()._dic[$url]) {
	            var baseData = ParticleManager.getInstance()._dic[$url];
	            baseData.clearUseNum();
	        }
	    }
	    addResByte($url, $data) {
	        if (!ParticleManager.getInstance()._dic[$url]) {
	            var baseData = new CombineParticleData();
	            ////console.log("load particle",$url);
	            baseData.setDataByte($data);
	            ParticleManager.getInstance()._dic[$url] = baseData;
	        }
	    }
	}

	class OverrideSkillFixEffect extends SkillFixEffect {
	    constructor($skillvo) {
	        super();
	        this.skill = $skillvo;
	    }
	    onPlayCom(event = null) {
	        this.particle.removeEventListener(BaseEvent.COMPLETE, this.onPlayCom, this);
	        this.skill.skillManager.sceneManager.particleManager.removeParticle(this.particle);
	        this.removeCallFun(this);
	    }
	    addToRender() {
	        if (!this.particle) {
	            return;
	        }
	        this.particle.reset();
	        this.particle.sceneVisible = true;
	        this.skill.skillManager.sceneManager.particleManager.addParticle(this.particle);
	        this.particle.addEventListener(BaseEvent.COMPLETE, this.onPlayCom, this);
	        if (this.outPos) {
	            this.particle.x = this.outPos.x;
	            this.particle.y = this.outPos.y;
	            this.particle.z = this.outPos.z;
	            this.particle.rotationX = this.rotation.x;
	            this.particle.rotationY = this.rotation.y + this.active.rotationY;
	            this.particle.rotationZ = this.rotation.z;
	            this.particle.bindTarget = null;
	        }
	        else if (this.hasSocket) {
	            var targetActive = this.active;
	            this.particle.bindTarget = (targetActive);
	            this.particle.bindSocket = this.socket;
	        }
	        else {
	            var ma = new Matrix3D;
	            ma.appendRotation(this.active.rotationY, Vector3D.Y_AXIS);
	            var v3d = ma.transformVector(this.pos);
	            v3d.x += this.active.x;
	            v3d.y += this.active.y;
	            v3d.z += this.active.z;
	            var $SkillBugBind = new SkillBugBind();
	            $SkillBugBind.bindMatrix = new Matrix3D;
	            $SkillBugBind.bindMatrix.appendRotation(this.rotation.x, Vector3D.X_AXIS);
	            $SkillBugBind.bindMatrix.appendRotation(this.rotation.y, Vector3D.Y_AXIS);
	            $SkillBugBind.bindMatrix.appendRotation(this.rotation.z, Vector3D.Z_AXIS);
	            $SkillBugBind.bindMatrix.appendRotation(this.active.rotationY, Vector3D.Y_AXIS);
	            $SkillBugBind.bindMatrix.appendTranslation(v3d.x, v3d.y, v3d.z);
	            this.particle.bindTarget = $SkillBugBind;
	        }
	    }
	}

	class OverrideSkillTrajectory extends SkillTrajectory {
	    reset() {
	        this.particle.reset();
	        this.skill.skillManager.sceneManager.particleManager.removeParticle(this.particle);
	        if (this.endParticle) {
	            this.endParticle.reset();
	            this.skill.skillManager.sceneManager.particleManager.addParticle(this.endParticle);
	            this.endParticle.setPos(this._currentTargetPos.x, this._currentTargetPos.y, this._currentTargetPos.z);
	        }
	        if (this.removeCallFun) {
	            this.removeCallFun(this);
	        }
	    }
	    addToRender() {
	        if (!this.particle) {
	            return;
	        }
	        this.particle.reset();
	        this.particle.sceneVisible = true;
	        this.skill.skillManager.sceneManager.particleManager.addParticle(this.particle);
	        var beginPos;
	        if (this.data.beginType == 0) {
	            var ma = new Matrix3D;
	            ma.appendRotation(this.active.rotationY, Vector3D.Y_AXIS);
	            beginPos = ma.transformVector(this.data.beginPos);
	            this._currentPos.setTo(this.active.x + beginPos.x, this.active.y + beginPos.y, this.active.z + beginPos.z);
	        }
	        else if (this.data.beginType == 1) {
	            var tempMa = new Matrix3D;
	            var bindActive = (this.active);
	            bindActive.getSocket(this.data.beginSocket, tempMa);
	            beginPos = tempMa.position;
	            this._currentPos.setTo(beginPos.x, beginPos.y, beginPos.z);
	        }
	        this.particle.setPos(this._currentPos.x, this._currentPos.y, this._currentPos.z);
	        this.path.add();
	    }
	    endPlayFun(e = null) {
	        this.skill.skillManager.sceneManager.particleManager.removeParticle(this.endParticle);
	        this.endParticle.removeEventListener(BaseEvent.COMPLETE, this.endPlayFun, this);
	    }
	    setInfo(obj) {
	        this.time = obj.frame * Scene_data.frameTime;
	        this.particle = this.skill.skillManager.sceneManager.particleManager.getParticleByte(Scene_data.fileRoot + obj.url);
	        this.particle.bindTarget = this;
	        this.data = obj;
	        //this.path.speed = this.data.speed;
	        if (this.data.endParticleUrl) {
	            this.endParticle = this.skill.skillManager.sceneManager.particleManager.getParticleByte(Scene_data.fileRoot + this.data.endParticleUrl);
	            this.endParticle.addEventListener(BaseEvent.COMPLETE, this.endPlayFun, this);
	        }
	        //this.time = obj.frame * Scene_data.frameTime;
	        //this.particle = this.skill.skillManager.sceneManager.particleManager.getParticleByte(Scene_data.fileRoot + obj.url);
	        //this.particle.bindTarget = this;
	        //this.data = <SkillTrajectoryTargetKeyVo>obj;
	        ////this.path.speed = this.data.speed;
	        //if (this.data.endParticleUrl) {
	        //    this.endParticle = this.skill.skillManager.sceneManager.particleManager.getParticleByte(Scene_data.fileRoot + this.data.endParticleUrl);
	        //    this.endParticle.addEventListener(BaseEvent.COMPLETE, this.endPlayFun, this);
	        //}
	    }
	}

	class OverrideSkill extends Skill {
	    constructor($skillManager = null) {
	        super();
	        this.baseName = "OverrideSkill";
	        this.skillManager = $skillManager;
	    }
	    skillComplete() {
	        this.skillManager.removeSkill(this);
	        this.isDeath = true;
	        if (this.completeFun) {
	            this.completeFun();
	        }
	        this.idleTime = 0;
	    }
	    setData($data, $skillData) {
	        if (this.hasDestory) {
	            return;
	        }
	        this.skillVo = new SkillVo();
	        this.skillVo.setData($data);
	        this.setKeyAry();
	        this.trajectoryAry = new Array;
	        this._skillData = $skillData;
	    }
	    setKeyAry() {
	        this.keyAry = new Array;
	        if (this.skillVo.types == SkillType.FixEffect) {
	            for (var i = 0; i < this.skillVo.keyAry.length; i++) {
	                var keySkill = new OverrideSkillFixEffect(this);
	                keySkill.setInfo(this.skillVo.keyAry[i]);
	                keySkill.removeCallFun = ($key) => { this.removeKey($key); };
	                keySkill.active = this.active;
	                this.keyAry.push(keySkill);
	            }
	        }
	        else if (this.skillVo.types == SkillType.TrajectoryDynamicTarget || this.skillVo.types == SkillType.TrajectoryDynamicPoint) {
	            for (var i = 0; i < this.skillVo.keyAry.length; i++) {
	                var trajectory;
	                var tkv = (this.skillVo.keyAry[i]);
	                if (tkv.multype == 1) ;
	                else {
	                    trajectory = new OverrideSkillTrajectory();
	                    trajectory.skill = this;
	                }
	                trajectory.setInfo(this.skillVo.keyAry[i]);
	                this.keyAry.push(trajectory);
	            }
	        }
	    }
	}

	class LayaOverride2dSkillManager extends SkillManager {
	    constructor($sceneManager) {
	        super();
	        this.sceneManager = $sceneManager;
	    }
	    addSrc($url, skillData) {
	        for (var key in skillData.data) {
	            var skill = new OverrideSkill(this);
	            skill.name = key;
	            skill.isDeath = true;
	            skill.src = true;
	            skill.setData(skillData.data[key], skillData);
	            skillData.addSrcSkill(skill);
	            //skillData.useNum++;
	            SkillManager.getInstance();
	            var dkey = $url + key;
	            if (!SkillManager.getInstance()._skillDic[dkey]) {
	                SkillManager.getInstance()._skillDic[dkey] = new Array;
	            }
	            SkillManager.getInstance()._skillDic[dkey].push(skill);
	        }
	    }
	    playSkill($skill) {
	        $skill.skillManager = this;
	        super.playSkill($skill);
	    }
	    getSkill($url, $name, $callback = null) {
	        var skill;
	        var key = $url + $name;
	        // if(key == "skill/jichu_1_byte.txtm_skill_04"){
	        //     console.log("添加技能风暴");
	        //     this.fengbaonum++;
	        // }
	        var ary = SkillManager.getInstance()._skillDic[key];
	        if (ary) {
	            for (var i = 0; i < ary.length; i++) {
	                skill = ary[i];
	                if (skill.isDeath && skill.useNum == 0) {
	                    skill.reset();
	                    skill.isDeath = false;
	                    return skill;
	                }
	            }
	        }
	        skill = new OverrideSkill(this);
	        skill.name = $name;
	        skill.isDeath = false;
	        if (!SkillManager.getInstance()._skillDic[key]) {
	            SkillManager.getInstance()._skillDic[key] = new Array;
	        }
	        SkillManager.getInstance()._skillDic[key].push(skill);
	        if (this._dic[$url]) {
	            skill.setData(this._dic[$url].data[skill.name], this._dic[$url]);
	            skill.key = key;
	            this._dic[$url].useNum++;
	            return skill;
	        }
	        if (SkillManager.getInstance()._loadDic[$url]) {
	            var obj = new Object;
	            obj.name = $name;
	            obj.skill = skill;
	            obj.callback = $callback;
	            SkillManager.getInstance()._loadDic[$url].push(obj);
	            return skill;
	        }
	        SkillManager.getInstance()._loadDic[$url] = new Array;
	        var obj = new Object;
	        obj.name = $name;
	        obj.skill = skill;
	        obj.callback = $callback;
	        SkillManager.getInstance()._loadDic[$url].push(obj);
	        ResManager.getInstance().loadSkillRes(Scene_data.fileRoot + $url, ($skillRes) => {
	            this.loadSkillCom($url, $skillRes);
	        });
	        return skill;
	    }
	    loadSkillCom($url, $skillRes) {
	        var skillData = new SkillData();
	        skillData.data = $skillRes.data;
	        for (var i = 0; i < SkillManager.getInstance()._loadDic[$url].length; i++) {
	            var obj = SkillManager.getInstance()._loadDic[$url][i];
	            if (!obj.skill.hasDestory) {
	                obj.skill.setData(skillData.data[obj.name], skillData);
	                obj.skill.key = $url + obj.name;
	                skillData.useNum++;
	            }
	        }
	        this._dic[$url] = skillData;
	        this.addSrc($url, skillData);
	        for (var i = 0; i < SkillManager.getInstance()._loadDic[$url].length; i++) {
	            var obj = SkillManager.getInstance()._loadDic[$url][i];
	            if (obj.callback) {
	                obj.callback();
	            }
	        }
	        SkillManager.getInstance()._loadDic[$url].length = 0;
	        SkillManager.getInstance()._loadDic[$url] = null;
	    }
	}

	class LayaGroupRes extends GroupRes {
	    constructor() {
	        super();
	    }
	    readParticle() {
	        var objNum = this._byte.readInt();
	        //this.particleAry = new Array;
	        var time = TimeUtil.getTimer();
	        for (var i = 0; i < objNum; i++) {
	            var url = Scene_data.fileRoot + this._byte.readUTF();
	            var size = this._byte.readInt();
	            var dataByte = new Pan3dByteArray;
	            dataByte.length = size;
	            this._byte.readBytes(dataByte, 0, size);
	            this.scene.particleManager.addResByte(url, dataByte);
	        }
	    }
	}
	class LayaOverrideGroupDataManager extends GroupDataManager {
	    getGroupData($url, $fun) {
	        if (this._dic[$url]) {
	            var gr = this._dic[$url];
	            gr.useNum++;
	            $fun(gr);
	            return;
	        }
	        if (this._loadDic[$url]) {
	            this._loadDic[$url].push($fun);
	            return;
	        }
	        this._loadDic[$url] = new Array;
	        this._loadDic[$url].push($fun);
	        var group = new LayaGroupRes();
	        group.scene = this.scene;
	        group.load($url, () => {
	            var ary = this._loadDic[$url];
	            for (var i = 0; i < ary.length; i++) {
	                var fun = ary[i];
	                fun(group);
	            }
	            this._dic[$url] = group;
	            delete this._loadDic[$url];
	            group.initReg();
	        });
	    }
	}

	class LayaOverride2dSceneManager extends OverrideSceneManager {
	    constructor() {
	        super();
	        this.particleManager = new LayaOverride2dParticleManager();
	        this.skillManager = new LayaOverride2dSkillManager(this);
	        this.groupDataManager = new LayaOverrideGroupDataManager();
	        console.log("创建场景=>", LayaOverride2dSceneManager.sceneNum++);
	    }
	    static initConfig() {
	        SceneManager._instance = new LayaOverride2dSceneManager;
	    }
	    update() {
	        MathClass.getCamView(Scene_data.cam3D, Scene_data.focus3D); //一定要角色帧渲染后再重置镜头矩阵
	        this.upFrame();
	    }
	    addMovieDisplay($display) {
	        $display._scene = this;
	        this._displayRoleList.push($display);
	        $display.addStage();
	    }
	    loadSceneConfigCom(obj) {
	        //保持原来的角度
	        var $rotationY = Scene_data.focus3D.rotationY;
	        super.loadSceneConfigCom(obj);
	        Scene_data.focus3D.rotationY = $rotationY;
	    }
	    playLyf($url, $pos, $r = 0) {
	        this.groupDataManager.scene = this;
	        this.groupDataManager.getGroupData(Scene_data.fileRoot + $url, (groupRes) => {
	            for (var i = 0; i < groupRes.dataAry.length; i++) {
	                var item = groupRes.dataAry[i];
	                if (item.types == BaseRes.SCENE_PARTICLE_TYPE) {
	                    var $particle = this.particleManager.getParticleByte(Scene_data.fileRoot + item.particleUrl);
	                    $particle.x = $pos.x;
	                    $particle.y = $pos.y;
	                    $particle.z = $pos.z;
	                    $particle.rotationY = $r;
	                    this.particleManager.addParticle($particle);
	                    $particle.addEventListener(BaseEvent.COMPLETE, this.onPlayCom, this);
	                }
	                else {
	                    console.log("播放的不是单纯特效");
	                }
	            }
	        });
	    }
	    /*  public charPlaySkill($char: LayaSceneChar, $skillfile: string): void {
	         if (!$char._scene.ready) {
	             return;
	         }
	 
	         var $skill: OverrideSkill = this.skillManager.getSkill(getSkillUrl($skillfile), "skill_01");
	         if (!$skill.keyAry) {
	             return;
	         }
	         if ($skill) {
	             $skill.reset();
	             $skill.isDeath = false;
	         }
	         $skill.configFixEffect($char);
	         this.skillManager.playSkill($skill)
	     } */
	    onPlayCom(value) {
	        this.particleManager.removeParticle((value.target));
	    }
	    upFrame() {
	        Scene_data.context3D._contextSetTest.clear();
	        if (isNaN(this._time)) {
	            this._time = TimeUtil.getTimer();
	        }
	        this.updateMovieFrame();
	        if (this._ready) {
	            this.particleManager.updateTime();
	            this.skillManager.update();
	            if (this.render) {
	                Scene_data.context3D.setWriteDepth(true);
	                Scene_data.context3D.setDepthTest(true);
	                this.updateStaticDiplay();
	                this.updateSpriteDisplay();
	                this.updateMovieDisplay();
	                //                ShadowManager.getInstance().update();
	                Scene_data.context3D.setWriteDepth(false);
	                this.particleManager.update();
	                //draw shadow pass
	                this.renderShadow();
	                /*                 Scene_data.context3D.setBlendParticleFactors(0)
	                                Scene_data.context3D.setWriteDepth(true);
	                                Scene_data.context3D.setWriteDepth(false); */
	            }
	            // Scene_data.context3D.setDepthTest(false);
	            this.cameraMatrix = Scene_data.cam3D.cameraMatrix.clone();
	            this.viewMatrx3D = Scene_data.viewMatrx3D;
	        }
	    }
	}
	LayaOverride2dSceneManager.sceneNum = 0;

	var WebGLContext = Laya.WebGLContext;
	/*
	该类需继承自显示对象类
	在该类中使用了自定义的着色器程序
	注意：使用自定义着色器时，需要设置该显示对象类的渲染模式this._renderType |= Laya.RenderSprite.CUSTOM;并且需要重写该类的渲染处理函数
	*/
	class LayaInsideSprite extends Laya.Sprite {
	    constructor() {
	        super();
	        /** @internal */
	        this._key = new Laya.SubmitKey();
	        this._layaRenderIndex = -1;
	        this.tscene = new LayaOverride2dSceneManager();
	        this.tscene.ready = true;
	    }
	    /**
	 * @inheritDoc
	 * @override
	 * @internal
	 */
	    render(ctx, x, y) {
	        //TODO:外层应该设计为接口调用
	        ctx["_curSubmit"] = Laya.SubmitBase.RENDERBASE; //打断2D合并的renderKey
	        ctx.addRenderObject(this);
	    }
	    renderSubmit() {
	        this._layaRenderIndex = -1;
	        LayaInsideSprite.saveLayaWebGLContext();
	        this.upFrame();
	        Scene_data.context3D.setWriteDepth(false);
	        Scene_data.context3D.setDepthTest(false);
	        LayaInsideSprite.revertLayaWebGLContext();
	        return 1;
	    }
	    getRenderType() {
	        return 0;
	    }
	    releaseRender() {
	    }
	    upFrame() {
	    }
	    // static lastBuffer: any;
	    // 保存WebGLContext laya的渲染状态
	    static saveLayaWebGLContext() {
	        let gl = Scene_data.context3D.renderContext;
	        /*         LayaInsideSprite.lastBuffer = Laya.Buffer._bindedVertexBuffer;
	                WebGLContext["_depthTest"] = Boolean(gl.isEnabled(gl.DEPTH_TEST));
	                WebGLContext["_depthMask"] = gl.getParameter(gl.DEPTH_WRITEMASK);
	                WebGLContext["_depthFunc"] = gl.getParameter(gl.DEPTH_FUNC)
	                WebGLContext["_blend"] = Boolean(gl.isEnabled(gl.BLEND));
	                WebGLContext["_sFactor"] = gl.getParameter(gl.BLEND_SRC_RGB);
	                WebGLContext["_dFactor"] = gl.getParameter(gl.BLEND_DST_RGB);
	                WebGLContext["_cullFace"] = Boolean(gl.isEnabled(gl.CULL_FACE));
	                WebGLContext['_cullFaceMode'] = gl.getParameter(gl.CULL_FACE_MODE);
	        
	                WebGLContext['_arrayBuffer'] = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
	                WebGLContext['_arrayBuffer'] && gl.bindBuffer(gl.ARRAY_BUFFER, null);
	                WebGLContext['_elementArrayBuffer'] = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
	                WebGLContext['_elementArrayBuffer'] && gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	        
	                WebGLContext['_frameBuffer'] = gl.getParameter(gl.FRAMEBUFFER_BINDING);
	                WebGLContext['_frameBuffer'] && gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	                WebGLContext['_renderBuffer'] = gl.getParameter(gl.RENDERBUFFER_BINDING);
	                WebGLContext['_renderBuffer'] && gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	        
	                WebGLContext['_bindTextureCubeMap'] = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP); */
	        WebGLContext['_activeTexture'] = gl.getParameter(gl.ACTIVE_TEXTURE);
	    }
	    // 还原WebGLContext到laya之前的渲染状态
	    static revertLayaWebGLContext() {
	        let gl = Scene_data.context3D.renderContext;
	        /*         WebGLContext["_depthTest"] ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);
	                gl.depthMask(WebGLContext["_depthMask"]);
	                gl.depthFunc(WebGLContext["_depthFunc"]);
	                WebGLContext["_blend"] ? gl.enable(gl.BLEND) : gl.disable(gl.BLEND);
	                gl.blendFunc(WebGLContext["_sFactor"], WebGLContext["_dFactor"]);
	                WebGLContext["_cullFace"] ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
	                gl.cullFace(WebGLContext['_cullFaceMode']);
	                gl.frontFace(WebGLContext["_frontFace"]);
	        
	                gl.bindBuffer(gl.ARRAY_BUFFER, gl['_arrayBuffer']);
	                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl['_elementArrayBuffer']);
	                gl.bindFramebuffer(gl.FRAMEBUFFER, gl['_frameBuffer']);
	                gl.bindRenderbuffer(gl.RENDERBUFFER, gl['_renderBuffer']); */
	        WebGLContext["_useProgram"] = null;
	        gl.activeTexture(WebGLContext["_activedTextureID"]);
	        Laya.Buffer._bindedVertexBuffer = null;
	        Laya.Buffer._bindedIndexBuffer = null;
	        Laya.BufferStateBase["_curBindedBufferState"] = null;
	        Laya.Context.set2DRenderConfig(); //还原2D配置
	    }
	}

	class mainpan3d {
	}

	class Context3D {
	    constructor() {
	        this.setTextureNum = 0;
	        this.setProgramNum = 0;
	    }
	    init($caves) {
	        //this.renderContext = $caves.getContext("experimental-webgl");
	        // this.renderContext =  Laya.LayaGL.instance;
	        this.renderContext = Laya.WebGLContext["mainContext"];
	        /*             var gl: any = $caves.getContext('webgl', { stencil: true, alpha: true, depth: true, antialias: false })
	                        || $caves.getContext('experimental-webgl', { stencil: true, alpha: true, depth: true, antialias: false }); */
	        /*     var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
	            var vendorExt = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
	            var rendererExt = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

	            let vendor:any = gl.getParameter(laya.webgl.WebGLRenderingContext.VENDOR);
	            let version:any = gl.getParameter(laya.webgl.WebGLRenderingContext.VERSION);
	            let render:any = gl.getParameter(laya.webgl.WebGLRenderingContext.RENDERER);
	       
	            let max_texture_units:any = gl.getParameter(laya.webgl.WebGLRenderingContext.MAX_TEXTURE_IMAGE_UNITS);
	            let max_texture_size:any = gl.getParameter(laya.webgl.WebGLRenderingContext.MAX_TEXTURE_SIZE);
	            let max_cube_texture_size:any = gl.getParameter(laya.webgl.WebGLRenderingContext.MAX_CUBE_MAP_TEXTURE_SIZE);
	            let max_vertex_attribs:any = gl.getParameter(laya.webgl.WebGLRenderingContext.MAX_VERTEX_ATTRIBS);
	            let max_vertex_uniform_vectors:any = gl.getParameter(laya.webgl.WebGLRenderingContext.MAX_VERTEX_UNIFORM_VECTORS);
	            

	            console.log(`VENDOR:`,vendor);
	            console.log(`VERSION:`,version);
	            console.log(`RENDERER:`,render);
	            console.log(`VENDOR_EXT:`,vendorExt);
	            console.log(`RENDERER_EXT:`,rendererExt);
	            console.log(`MAX_TEXTURE_IMAGE_UNITS:`,max_texture_units);
	            console.log(`MAX_TEXTURE_SIZE:`,max_texture_size);
	            console.log(`MAX_CUBE_MAP_TEXTURE_SIZE:`,max_cube_texture_size);
	            console.log(`MAX_VERTEX_ATTRIBS:`,max_vertex_attribs);
	            console.log(`MAX_VERTEX_UNIFORM_VECTORS:`,max_vertex_uniform_vectors); */
	        this._contextSetTest = new ContextSetTest();
	    }
	    resetSize($width, $height) {
	        // this.renderContext.viewport(0, 0, $width, $height);
	    }
	    uploadBuff3D($jsData) {
	        var $buffData = this.renderContext.createBuffer();
	        this.renderContext.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, $buffData);
	        this.renderContext.bufferData(WebGLRenderingContext.ARRAY_BUFFER, new Float32Array($jsData), WebGLRenderingContext.STATIC_DRAW);
	        return $buffData;
	    }
	    uploadBuff3DArrayBuffer($jsData) {
	        var $buffData = this.renderContext.createBuffer();
	        this.renderContext.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, $buffData);
	        this.renderContext.bufferData(WebGLRenderingContext.ARRAY_BUFFER, $jsData, WebGLRenderingContext.STATIC_DRAW);
	        return $buffData;
	    }
	    uploadBuff3DByBuffer($buffData, $jsData) {
	        this.renderContext.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, $buffData);
	        this.renderContext.bufferData(WebGLRenderingContext.ARRAY_BUFFER, new Float32Array($jsData), WebGLRenderingContext.STATIC_DRAW);
	    }
	    uploadIndexBuff3D($iStrData) {
	        var $iBuffer = this.renderContext.createBuffer();
	        this.renderContext.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, $iBuffer);
	        this.renderContext.bufferData(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, new Uint16Array($iStrData), WebGLRenderingContext.STATIC_DRAW);
	        return $iBuffer;
	    }
	    uploadIndexBuff3DByBuffer($iBuffer, $iStrData) {
	        this.renderContext.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, $iBuffer);
	        this.renderContext.bufferData(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, new Uint16Array($iStrData), WebGLRenderingContext.STATIC_DRAW);
	    }
	    //public num_setProgram:number = 0;
	    clearContext() {
	        this.renderContext.depthMask(true);
	        this.renderContext.clear(WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT | WebGLRenderingContext.STENCIL_BUFFER_BIT);
	    }
	    /*        public update(): void {
	               this._contextSetTest.clear();
	               this.renderContext.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
	               this.renderContext.clearColor(63 / 255, 63 / 255, 63 / 255, 1.0);
	               this.renderContext.clearDepth(1.0);
	               this.renderContext.clearStencil(0.0);
	               this.renderContext.enable(this.renderContext.DEPTH_TEST);
	               this.renderContext.depthMask(true);
	               this.renderContext.enable(this.renderContext.BLEND);
	               this.renderContext.frontFace(this.renderContext.CW);
	   
	               this.renderContext.clear(this.renderContext.COLOR_BUFFER_BIT | this.renderContext.DEPTH_BUFFER_BIT | this.renderContext.STENCIL_BUFFER_BIT);
	               //this.renderContext.blendFunc(this.renderContext.SRC_ALPHA, this.renderContext.ONE_MINUS_SRC_ALPHA);
	               this.setBlendParticleFactors(0);
	               this.renderContext.disable(this.renderContext.CULL_FACE);
	   
	               ////console.log("program设置次数：" + this.setProgramNum + "纹理设置次数：" + this.setTextureNum);
	               this.setTextureNum = 0;
	               this.setProgramNum = 0;
	   
	           } */
	    updateFBO(fbo) {
	        this.renderContext.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, fbo.frameBuffer);
	        this.renderContext.clearColor(63 / 255, 63 / 255, 63 / 255, 1.0);
	        this.renderContext.clearDepth(1.0);
	        this.renderContext.clearStencil(0.0);
	        this.renderContext.enable(WebGLRenderingContext.DEPTH_TEST);
	        this.renderContext.depthMask(true);
	        this.renderContext.enable(WebGLRenderingContext.BLEND);
	        this.renderContext.frontFace(WebGLRenderingContext.CW);
	        this.renderContext.clear(WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT | WebGLRenderingContext.STENCIL_BUFFER_BIT);
	        //this.renderContext.blendFunc(this.renderContext.SRC_ALPHA, this.renderContext.ONE_MINUS_SRC_ALPHA);
	        this.setBlendParticleFactors(0);
	        this.renderContext.disable(WebGLRenderingContext.CULL_FACE);
	    }
	    setDepthTest(tf) {
	        if (tf) {
	            this.renderContext.enable(WebGLRenderingContext.DEPTH_TEST);
	        }
	        else {
	            this.renderContext.disable(WebGLRenderingContext.DEPTH_TEST);
	        }
	    }
	    setWriteDepth(tf) {
	        if (this._contextSetTest.testZbuffer(tf)) {
	            return;
	        }
	        this.renderContext.depthMask(tf);
	    }
	    setBlendParticleFactors(type) {
	        if (this._contextSetTest.testBlend(type)) {
	            return;
	        }
	        switch (type) {
	            case 0:
	                this.renderContext.blendFunc(WebGLRenderingContext.ONE, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA);
	                break;
	            case 1:
	                this.renderContext.blendFunc(WebGLRenderingContext.ONE, WebGLRenderingContext.ONE);
	                break;
	            case 2:
	                this.renderContext.blendFunc(WebGLRenderingContext.DST_COLOR, WebGLRenderingContext.ZERO);
	                break;
	            case 3:
	                this.renderContext.blendFunc(WebGLRenderingContext.ONE, WebGLRenderingContext.ONE_MINUS_SRC_COLOR);
	                break;
	            case 4:
	                this.renderContext.blendFunc(WebGLRenderingContext.SRC_ALPHA, WebGLRenderingContext.ONE);
	                break;
	            case -1:
	                this.renderContext.blendFunc(WebGLRenderingContext.SRC_ALPHA, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA);
	                break;
	        }
	    }
	    setProgram($program) {
	        if (this._contextSetTest.testProgram($program)) {
	            return;
	        }
	        this.renderContext.useProgram($program);
	        this.setProgramNum++;
	    }
	    getLocation($program, $name) {
	        return this.renderContext.getUniformLocation($program, $name);
	    }
	    //public locationDic: any = new Object();
	    /** ***************************setvc */
	    setVcMatrix3fv($program, $name, $m) {
	        this.renderContext.uniformMatrix3fv($program.getWebGLUniformLocation($name), false, $m);
	    }
	    setVcMatrix4fv($program, $name, $m) {
	        this.renderContext.uniformMatrix4fv($program.getWebGLUniformLocation($name), false, $m);
	    }
	    setVpMatrix($program, $m) {
	        if (this._contextSetTest.testVp()) {
	            return;
	        }
	        this.renderContext.uniformMatrix4fv($program.getWebGLUniformLocation("vpMatrix3D"), false, $m);
	    }
	    setVc4fv($program, $name, $m) {
	        this.renderContext.uniform4fv($program.getWebGLUniformLocation($name), $m);
	    }
	    setVc1fv($program, $name, $m) {
	        this.renderContext.uniform1fv($program.getWebGLUniformLocation($name), $m);
	    }
	    setVc3fv($program, $name, $m) {
	        this.renderContext.uniform3fv($program.getWebGLUniformLocation($name), $m);
	    }
	    setVc2fv($program, $name, $m) {
	        this.renderContext.uniform2fv($program.getWebGLUniformLocation($name), $m);
	    }
	    setVcFloat($program, $name, $m) {
	        this.renderContext.uniform1fv($program.getWebGLUniformLocation($name), $m);
	    }
	    /** ******************************************* end setvc */
	    setuniform3f($program, $name, a, b, c) {
	        this.renderContext.uniform3f($program.getWebGLUniformLocation($name), a, b, c);
	    }
	    setVcMatrix4fvLocation($location, $m) {
	        this.renderContext.uniformMatrix4fv($location, false, $m);
	    }
	    setVc2f($program, $name, a, b) {
	        this.renderContext.uniform2f($program.getWebGLUniformLocation($name), a, b);
	    }
	    setVcMatrix2fvLocation($location, $m) {
	        this.renderContext.uniformMatrix2fv($location, false, $m);
	    }
	    //  public static maxLen:number=0
	    setVc4fvLocation($location, $m) {
	        //if (Context3D.maxLen < $m.length) {
	        //    //console.log("在此处有变化renderContext",$m.length);
	        //    Context3D.maxLen = $m.length;
	        //}
	        this.renderContext.uniform4fv($location, $m);
	    }
	    setVa(dataId, dataWidth, dataBuffer) {
	        this._contextSetTest.testVa(dataBuffer);
	        this.renderContext.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, dataBuffer);
	        if (dataBuffer) {
	            this.renderContext.enableVertexAttribArray(dataId);
	            this.renderContext.vertexAttribPointer(dataId, dataWidth, WebGLRenderingContext.FLOAT, false, 0, 0);
	        }
	    }
	    pushVa(dataBuffer) {
	        if (!this._contextSetTest.testVa(dataBuffer)) {
	            this.renderContext.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, dataBuffer);
	            return false;
	        }
	        else {
	            return true;
	        }
	    }
	    setVaOffset(dataId, dataWidth, stride, offset) {
	        if (!this._contextSetTest.enableVaAry[dataId]) {
	            this.renderContext.enableVertexAttribArray(dataId);
	            this._contextSetTest.enableVaAry[dataId] = true;
	        }
	        this.renderContext.vertexAttribPointer(dataId, dataWidth, WebGLRenderingContext.FLOAT, false, stride, offset);
	    }
	    clearVa(dataId) {
	        //this._contextSetTest.testVa(null);
	        this._contextSetTest.enableVaAry[dataId] = false;
	        this.renderContext.disableVertexAttribArray(dataId);
	    }
	    drawCall($iBuffer, $numTri) {
	        this.renderContext.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, $iBuffer);
	        this.renderContext.drawElements(WebGLRenderingContext.TRIANGLES, $numTri, WebGLRenderingContext.UNSIGNED_SHORT, 0);
	        Laya.Stat.renderBatches += 1;
	        // var errorID = this.renderContext.getError();
	        // if (errorID != 0) {
	        //     //console.log(errorID);
	        // }
	    }
	    drawCallL3d($numTri) {
	        this.renderContext.drawElements(WebGLRenderingContext.TRIANGLES, $numTri, WebGLRenderingContext.UNSIGNED_SHORT, 0);
	        Laya.Stat.renderBatches += 1;
	        // var errorID = this.renderContext.getError();
	        // if (errorID != 0) {
	        //     //console.log(errorID);
	        // }
	    }
	    drawLine($iBuffer, $numTri) {
	        this.renderContext.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, $iBuffer);
	        this.renderContext.drawElements(WebGLRenderingContext.LINES, $numTri, WebGLRenderingContext.UNSIGNED_SHORT, 0);
	    }
	    setRenderTexture($program, $name, $textureObject, $level, test = true) {
	        if (test && this._contextSetTest.testTexture($name, $textureObject)) {
	            return;
	        }
	        if ($level == 0) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE0);
	        }
	        else if ($level == 1) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE1);
	        }
	        else if ($level == 2) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE2);
	        }
	        else if ($level == 3) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE3);
	        }
	        else if ($level == 4) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE4);
	        }
	        else if ($level == 5) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE5);
	        }
	        else if ($level == 6) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE6);
	        }
	        this.renderContext.bindTexture(WebGLRenderingContext.TEXTURE_2D, $textureObject);
	        this.renderContext.uniform1i($program.getWebGLUniformLocation($name), $level);
	        this.setTextureNum++;
	    }
	    clearTexture() {
	        // this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE0);
	        // this.renderContext.bindTexture(WebGLRenderingContext.TEXTURE_2D, null);
	    }
	    setRenderTextureCube($program, $name, $textureObject, $level) {
	        if ($level == 0) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE0);
	        }
	        else if ($level == 1) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE1);
	        }
	        else if ($level == 2) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE2);
	        }
	        else if ($level == 3) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE3);
	        }
	        else if ($level == 4) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE4);
	        }
	        else if ($level == 5) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE5);
	        }
	        else if ($level == 6) {
	            this.renderContext.activeTexture(WebGLRenderingContext.TEXTURE6);
	        }
	        this.renderContext.bindTexture(WebGLRenderingContext.TEXTURE_CUBE_MAP, $textureObject);
	        this.renderContext.uniform1i(this.renderContext.getUniformLocation($program, $name), $level);
	    }
	    updateTexture($texture, $offsetx, $offsety, $img) {
	        this.renderContext.bindTexture(WebGLRenderingContext.TEXTURE_2D, $texture);
	        this.renderContext.texSubImage2D(WebGLRenderingContext.TEXTURE_2D, 0, $offsetx, $offsety, WebGLRenderingContext.RGBA, WebGLRenderingContext.UNSIGNED_BYTE, $img);
	    }
	    getTexture($img, $wrap = 0, $filter = 0, $mipmap = 0) {
	        // $mipmap=0
	        var $textureRect = new Rectangle(0, 0, Math.pow(2, Math.ceil(Math.log($img.width) / Math.log(2))), Math.pow(2, Math.ceil(Math.log($img.height) / Math.log(2))));
	        if ($textureRect.width != $img.width || $textureRect.height != $img.height) {
	            //console.log("图片尺寸不为2幂")
	            //alert("图片尺寸不为2幂")
	            var $ctx = UIManager.getInstance().getContext2D($textureRect.width, $textureRect.height, false);
	            $ctx.drawImage($img, 0, 0, $img.width, $img.height, 0, 0, $textureRect.width, $textureRect.height);
	            return this.getTexture($ctx.canvas, 0, 0);
	        }
	        var textureObject = this.renderContext.createTexture();
	        this.renderContext.bindTexture(WebGLRenderingContext.TEXTURE_2D, textureObject);
	        this.renderContext.texImage2D(WebGLRenderingContext.TEXTURE_2D, 0, WebGLRenderingContext.RGBA, WebGLRenderingContext.RGBA, WebGLRenderingContext.UNSIGNED_BYTE, $img);
	        this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_MAG_FILTER, WebGLRenderingContext.LINEAR);
	        this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_MIN_FILTER, WebGLRenderingContext.LINEAR);
	        if ($wrap == 0) {
	            this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_WRAP_S, WebGLRenderingContext.REPEAT);
	            this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_WRAP_T, WebGLRenderingContext.REPEAT);
	        }
	        else {
	            this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_WRAP_S, WebGLRenderingContext.CLAMP_TO_EDGE);
	            this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_WRAP_T, WebGLRenderingContext.CLAMP_TO_EDGE);
	        }
	        if ($mipmap != 0) {
	            this.renderContext.generateMipmap(WebGLRenderingContext.TEXTURE_2D);
	        }
	        // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
	        return textureObject;
	    }
	    creatTexture($width, $height, $wrap = 0) {
	        var $texture = this.renderContext.createTexture();
	        this.renderContext.bindTexture(WebGLRenderingContext.TEXTURE_2D, $texture);
	        this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_MAG_FILTER, WebGLRenderingContext.LINEAR);
	        this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_MIN_FILTER, WebGLRenderingContext.LINEAR);
	        if ($wrap == 0) {
	            this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_WRAP_S, WebGLRenderingContext.REPEAT);
	            this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_WRAP_T, WebGLRenderingContext.REPEAT);
	        }
	        else {
	            this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_WRAP_S, WebGLRenderingContext.CLAMP_TO_EDGE);
	            this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_WRAP_T, WebGLRenderingContext.CLAMP_TO_EDGE);
	        }
	        this.renderContext.texImage2D(WebGLRenderingContext.TEXTURE_2D, 0, WebGLRenderingContext.RGB, $width, $height, 0, WebGLRenderingContext.RGB, WebGLRenderingContext.UNSIGNED_BYTE, null);
	        return $texture;
	    }
	    createFramebuffer() {
	        var fboBuffer = this.renderContext.createFramebuffer();
	        this.renderContext.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, fboBuffer);
	        return fboBuffer;
	    }
	    deleteBuffer(buffer) {
	        //var ooo:any = buffer;
	        //ooo.destory = true;
	        this.renderContext.deleteBuffer(buffer);
	        if (this.renderContext.getError() != 0) ;
	    }
	    deleteTexture(texture) {
	        //return;
	        //var ooo:any = texture;
	        //ooo.destory = true;
	        this.renderContext.deleteTexture(texture);
	    }
	    deleteShader(shader) {
	        //return;
	        this.renderContext.deleteShader(shader.vShader);
	        this.renderContext.deleteShader(shader.fShader);
	        this.renderContext.deleteProgram(shader.program);
	    }
	    cullFaceBack(tf) {
	        if (this._contextSetTest.testCull(tf)) {
	            return;
	        }
	        if (tf) {
	            this.renderContext.enable(WebGLRenderingContext.CULL_FACE);
	            this.renderContext.cullFace(WebGLRenderingContext.BACK);
	        }
	        else {
	            this.renderContext.disable(WebGLRenderingContext.CULL_FACE);
	        }
	    }
	    getFBO() {
	        var fw = FBO.fw;
	        var fh = FBO.fh;
	        var frameBuffer = this.renderContext.createFramebuffer();
	        this.renderContext.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, frameBuffer);
	        var depthRenderBuffer = this.renderContext.createRenderbuffer();
	        this.renderContext.bindRenderbuffer(WebGLRenderingContext.RENDERBUFFER, depthRenderBuffer);
	        this.renderContext.renderbufferStorage(WebGLRenderingContext.RENDERBUFFER, WebGLRenderingContext.DEPTH_COMPONENT16, fw, fh);
	        this.renderContext.framebufferRenderbuffer(WebGLRenderingContext.FRAMEBUFFER, WebGLRenderingContext.DEPTH_ATTACHMENT, WebGLRenderingContext.RENDERBUFFER, depthRenderBuffer);
	        var fTexture = this.renderContext.createTexture();
	        this.renderContext.bindTexture(WebGLRenderingContext.TEXTURE_2D, fTexture);
	        this.renderContext.texImage2D(WebGLRenderingContext.TEXTURE_2D, 0, WebGLRenderingContext.RGBA, fw, fh, 0, WebGLRenderingContext.RGBA, WebGLRenderingContext.UNSIGNED_BYTE, null);
	        this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_MAG_FILTER, WebGLRenderingContext.LINEAR);
	        this.renderContext.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_MIN_FILTER, WebGLRenderingContext.LINEAR);
	        this.renderContext.framebufferTexture2D(WebGLRenderingContext.FRAMEBUFFER, WebGLRenderingContext.COLOR_ATTACHMENT0, WebGLRenderingContext.TEXTURE_2D, fTexture, 0);
	        this.renderContext.bindTexture(WebGLRenderingContext.TEXTURE_2D, null);
	        this.renderContext.bindRenderbuffer(WebGLRenderingContext.RENDERBUFFER, null);
	        this.renderContext.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
	        var fbo = new FBO();
	        fbo.frameBuffer = frameBuffer;
	        fbo.depthBuffer = depthRenderBuffer;
	        fbo.texture = fTexture;
	        return fbo;
	    }
	    clearTest() {
	        this._contextSetTest.clear();
	    }
	}
	class FBO {
	}
	FBO.fw = 512;
	FBO.fh = 512;
	class ContextSetTest {
	    constructor() {
	        this.enableVaAry = new Array;
	        this.vaAry = new Array;
	        this._blendType = -1000;
	        this._cullType = false;
	        this._zbufferType = true;
	        this._vpMatrix = false;
	    }
	    testTexture($name, $textureObject) {
	        if (this._textureDic[$name] == $textureObject) {
	            return true;
	        }
	        else {
	            this._textureDic[$name] = $textureObject;
	            return false;
	        }
	    }
	    testProgram($program) {
	        if (this._program == $program) {
	            return true;
	        }
	        else {
	            this._program = $program;
	            this._textureDic = new Object();
	            this._vpMatrix = false;
	            return false;
	        }
	    }
	    testVa(dataBuffer) {
	        if (this._vabuffer == dataBuffer) {
	            return true;
	        }
	        else {
	            this._vabuffer = dataBuffer;
	            return false;
	        }
	    }
	    clear() {
	        this._blendType = -1000;
	        this._cullType = false;
	        this._vpMatrix = false;
	        this._program = null;
	        this._vabuffer = null;
	    }
	    testBlend($type) {
	        if (this._blendType == $type) {
	            return true;
	        }
	        else {
	            this._blendType = $type;
	            return false;
	        }
	    }
	    testCull($type) {
	        if (this._cullType == $type) {
	            return true;
	        }
	        else {
	            this._cullType = $type;
	            return false;
	        }
	    }
	    testZbuffer($type) {
	        if (this._zbufferType == $type) {
	            return true;
	        }
	        else {
	            this._zbufferType = $type;
	            return false;
	        }
	    }
	    testVp() {
	        if (this._vpMatrix) {
	            return true;
	        }
	        else {
	            this._vpMatrix = true;
	            return false;
	        }
	    }
	}

	class Camera3D extends Object3D {
	    constructor() {
	        super();
	        this._distance = 500;
	        this.offset = new Vector3D();
	        this.cameraMatrix = new Matrix3D;
	    }
	    get distance() {
	        return this._distance;
	    }
	    set distance(value) {
	        this._distance = value;
	    }
	}

	class LightVo {
	    constructor() {
	        this.sunDirect = new Array(0, 1, 0);
	        this.sunColor = new Array(2, 0, 0);
	        this.ambientColor = new Array(0, 0, 0);
	    }
	    setData(sd, sc, ac) {
	        this.sunDirect[0] = sd.x;
	        this.sunDirect[1] = sd.y;
	        this.sunDirect[2] = sd.z;
	        this.sunColor[0] = sc.x;
	        this.sunColor[1] = sc.y;
	        this.sunColor[2] = sc.z;
	        this.ambientColor[0] = ac.x;
	        this.ambientColor[1] = ac.y;
	        this.ambientColor[2] = ac.z;
	    }
	}

	class OverrideEngine extends Engine {
	    constructor() {
	        super();
	    }
	    /*     public static initConfig(): void {
	            Engine.update = () => { this.update() }  //更换update
	            Engine.init = ($caves: HTMLCanvasElement) => { this.init($caves) } //更换引擎初始化
	            Engine.resetSize = (width?: number, height?: number) => { this.resetSize(width, height) } //更尺寸变化
	    
	        } */
	    /*     public static update(): void {
	    
	    
	            TimeUtil.update();
	            // SceneManager.getInstance().update();
	        } */
	    static resetSize(width, height) {
	        Scene_data.stageWidth = width;
	        Scene_data.stageHeight = height;
	        Scene_data.canvas3D.width = Scene_data.stageWidth;
	        Scene_data.canvas3D.height = Scene_data.stageHeight;
	        Scene_data.context3D.resetSize(Scene_data.stageWidth, Scene_data.stageHeight);
	        Engine.resetViewMatrx3D();
	    }
	    static init($caves) {
	        var isIpad = /ipad/i.test(navigator.userAgent);
	        var isIphone = /iPhone/i.test(navigator.userAgent);
	        var isAndroid = /android/i.test(navigator.userAgent);
	        var isWindow = /iindow/i.test(navigator.userAgent);
	        var sUserAgent = navigator.userAgent.toLowerCase();
	        ////console.log("--sUserAgent--",sUserAgent,isIpad,isIphone,isAndroid,isWindow);
	        if (isIpad || isIphone || isAndroid) {
	            Scene_data.isPc = false;
	        }
	        else {
	            Scene_data.isPc = true;
	        }
	        Scene_data.vpMatrix = new Matrix3D;
	        Scene_data.canvas3D = $caves;
	        Scene_data.context3D = new Context3D();
	        Scene_data.context3D.init($caves);
	        Scene_data.cam3D = new Camera3D;
	        Scene_data.focus3D = new Object3D;
	        /*         Scene_data.focus3D.x = 0;
	                Scene_data.focus3D.y = 0;
	                Scene_data.focus3D.z = 0;
	                Scene_data.focus3D.rotationY = 135;
	                Scene_data.focus3D.rotationX = -45; */
	        Scene_data.light = new LightVo();
	        TimeUtil.init();
	        Scene_data.supportBlob = false;
	    }
	}

	class Override2dEngine extends OverrideEngine {
	    constructor() {
	        super();
	    }
	    /*     public static initConfig(): void {
	            Engine.update = () => { this.update() }  //更换update
	            Engine.init = ($caves: HTMLCanvasElement) => { this.init($caves) } //更换引擎初始化
	            Engine.resetSize = (width?: number, height?: number) => { this.resetSize(width, height) } //更尺寸变化
	    
	            Engine.resetViewMatrx3D = () => { this.resetViewMatrx3D() }
	        } */
	    static resetSize(width, height) {
	        if (isNaN(width)) {
	            width = document.body.clientWidth;
	        }
	        if (isNaN(height)) {
	            height = document.body.clientHeight;
	        }
	        Scene_data.stageWidth = width;
	        Scene_data.stageHeight = height;
	        Scene_data.context3D.resetSize(Scene_data.stageWidth, Scene_data.stageHeight);
	        Engine.resetViewMatrx3D();
	        CanvasPostionModel.getInstance().resetSize();
	    }
	    static init($caves) {
	        OverrideEngine.init($caves);
	        Scene_data.focus3D.x = 0;
	        Scene_data.focus3D.y = 0;
	        Scene_data.focus3D.z = 0;
	        /*         Scene_data.focus3D.rotationY = 0;
	                Scene_data.focus3D.rotationX = -45
	                Scene_data.cam3D.distance = 250; */
	    }
	    static resetViewMatrx3D() {
	        if (Scene_data.viewMatrx3D) {
	            Scene_data.viewMatrx3D.identity();
	        }
	        else {
	            Scene_data.viewMatrx3D = new Matrix3D;
	        }
	        var fovw = Scene_data.stageWidth;
	        var fovh = Scene_data.stageHeight;
	        var sX = 2 / fovw;
	        var sY = 2 / fovh;
	        Scene_data.viewMatrx3D.appendScale(sX, sY, 1 / 1000);
	    }
	}

	class LayaOverride2dEngine extends OverrideEngine {
	    constructor() {
	        super();
	    }
	    static initConfig() {
	        // Engine.update = () => { this.update() }  //更换update
	        Engine.init = ($caves) => { Override2dEngine.init($caves); }; //更换引擎初始化
	        Engine.resetSize = (width, height) => { Override2dEngine.resetSize(width, height); }; //更尺寸变化
	        Engine.resetViewMatrx3D = () => { Override2dEngine.resetViewMatrx3D(); };
	    }
	}

	class LayaScene2dInit {
	    static initData() {
	        if (!LayaScene2dInit.isConfig) {
	            //  Scene_data.fileRoot = " http://" + document.domain + "/res/";
	            //替换SceneManager场景管理对象；
	            // LayaOverride2dSceneManager.initConfig();
	            //替换Engine引擎对象；
	            LayaOverride2dEngine.initConfig();
	            Engine.init(mainpan3d.canvas); //初始化场景
	            Engine.resetSize(mainpan3d.canvas.width, mainpan3d.canvas.height); //设置canvas大小
	            //    Engine.initPbr();
	            LayaScene2dInit.isConfig = true; //完成
	            SceneManager.getInstance().ready = true; //场景update可以
	            this.sceneItem = new Array;
	        }
	    }
	}
	LayaScene2dInit.isConfig = false;

	//此类可用于修改场景的渲染队列 或显示3D 或2D的模式
	class BaseLaya3dSprite extends LayaInsideSprite {
	    constructor() {
	        if (!LayaScene2dInit.isConfig) {
	            LayaScene2dInit.initData();
	        }
	        super();
	    }
	    upFrame() {
	        Scene_data.context3D.setWriteDepth(true);
	        Scene_data.context3D.setDepthTest(true);
	        TimeUtil.update();
	        //设置为2D的镜头角度
	        Scene_data.focus3D.rotationY = 0;
	        Scene_data.focus3D.rotationX = -CanvasPostionModel.SCENE_2D_ROTATION_45;
	        Scene_data.cam3D.distance = 500;
	        //这是是移动2D的基础坐标
	        CanvasPostionModel.getInstance().tureMoveV2d = new Vector2D(this.x, this.y);
	        CanvasPostionModel.getInstance().resetSize();
	        Scene_data.context3D.renderContext.clear(WebGLRenderingContext.DEPTH_BUFFER_BIT); //重置深度
	        MathClass.getCamView(Scene_data.cam3D, Scene_data.focus3D); //一定要角色帧渲染后再重置镜头矩阵
	        Scene_data.context3D._contextSetTest.clear();
	        this.tscene.upFrame();
	    }
	}

	class ModuleEventManager {
	    static addEvents(ary, $fun, $thisObj) {
	        for (var i = 0; i < ary.length; i++) {
	            ModuleEventManager._instance.addEventListener(ary[i].type, $fun, $thisObj);
	        }
	    }
	    static dispatchEvent($event) {
	        ModuleEventManager._instance.dispatchEvent($event);
	    }
	}
	ModuleEventManager._instance = new EventDispatcher();

	class Processor {
	    constructor() {
	    }
	    getName() {
	        throw new Error("process必须复写命名");
	        //return "";
	    }
	    /**
	    * 解析事件，之后交给处理函数
	    * @param $notification
	    */
	    receivedModuleEvent($event) {
	    }
	    /**
	    * 监听的事件类的集合
	    * 请注意：返回为事件的CLASS(这些CLASS必须继承自ModuleEvent)的数组
	    * @return
	    *
	    */
	    listenModuleEvents() {
	        return null;
	    }
	    registerEvents() {
	        //注册消息监听
	        var meClassArr = this.listenModuleEvents();
	        if (meClassArr != null && meClassArr.length > 0) {
	            ModuleEventManager.addEvents(meClassArr, this.receivedModuleEvent, this);
	        }
	    }
	    getHanderMap() {
	        var obj = new Object;
	        return obj;
	    }
	}

	class BaseProcessor extends Processor {
	}

	class CharAction {
	}
	CharAction.STANAD = "stand";
	CharAction.WALK = "walk";
	CharAction.DEATH = "death";
	CharAction.JUMP = "jump";
	CharAction.SIT = "sit";
	CharAction.ATTACK_01 = "attack_01";
	CharAction.ATTACK_02 = "attack_02";
	CharAction.ATTACK_03 = "attack_03";
	CharAction.ATTACK_04 = "attack_04";
	CharAction.ATTACK_05 = "attack_05";
	CharAction.ATTACK_06 = "attack_06";
	CharAction.ATTACK_010 = "attack_010";
	CharAction.ATTACK_020 = "attack_020";
	CharAction.STAND_MOUNT = "stand_mount_01";
	CharAction.WALK_MOUNT = "walk_mount_01";
	CharAction.s_attack_01 = "s_attack_01"; //移动中行走的特殊技能

	class SceneBaseChar extends Display3dMovie {
	    constructor() {
	        super(...arguments);
	        this._avatar = -1;
	        this._visible = true;
	    }
	    get visible() {
	        return this._visible;
	    }
	    set visible(value) {
	        this._visible = value;
	    }
	    setAvatar(num) {
	        if (this._avatar == num) {
	            return;
	        }
	        this._avatar = num;
	        this.setRoleUrl(this.getSceneCharAvatarUrl(num));
	    }
	    update() {
	        if (this.visible) {
	            super.update();
	        }
	        if (this._shadow) {
	            this._shadow._visible = this.visible;
	        }
	    }
	    getSceneCharAvatarUrl(num) {
	        var $url = UnitFunction.getRoleUrl(num);
	        return UnitFunction.getRoleUrl(num);
	    }
	    getSceneCharWeaponUrl(num, $suffix = "") {
	        return UnitFunction.getModelUrl(String(num + $suffix));
	    }
	}

	class MountChar extends SceneBaseChar {
	    setData($rank, $iid) {
	        if ($iid > 0) {
	            var obj = {};
	            var avatar = obj.mountID;
	            this.setAvatar(avatar);
	            return;
	        }
	        if ($rank > 0) {
	            var obj = {};
	            var avatar = obj.mountID;
	            this.setAvatar(avatar);
	        }
	    }
	}

	class TestTriangle {
	    constructor($p1 = null, $p2 = null, $p3 = null, $precision = 0.1) {
	        this.p1 = $p1;
	        this.p2 = $p2;
	        this.p3 = $p3;
	        this.precision = $precision;
	    }
	    setAllPoint($p1, $p2, $p3) {
	        this.p1 = $p1;
	        this.p2 = $p2;
	        this.p3 = $p3;
	    }
	    checkPointIn(tp) {
	        var area = this.getArea();
	        var targetThreeTimesArea = 0;
	        targetThreeTimesArea += TestTriangle.getAreaByPoints(tp, this.p1, this.p2);
	        targetThreeTimesArea += TestTriangle.getAreaByPoints(tp, this.p2, this.p3);
	        targetThreeTimesArea += TestTriangle.getAreaByPoints(tp, this.p3, this.p1);
	        return targetThreeTimesArea == area || Math.abs(targetThreeTimesArea - area) < this.precision;
	    }
	    getArea() {
	        return TestTriangle.getAreaByPoints(this.p1, this.p2, this.p3);
	    }
	    static getAreaByPoints(p1, p2, p3) {
	        // 方法一
	        // 利用两点之间距离公式，求出三角形的三边长a，b，c后，
	        // 令p = (a+b+c)/2。再套入以下公式就可以求出三角形的面积S :
	        // S = sqrt(p*(p-a)*(p-b)*(p-c))
	        var dx = p1.x - p2.x;
	        var dy = p1.y - p2.y;
	        var p1Len = Math.sqrt(dx * dx + dy * dy);
	        dx = p2.x - p3.x;
	        dy = p2.y - p3.y;
	        var p2Len = Math.sqrt(dx * dx + dy * dy);
	        dx = p3.x - p1.x;
	        dy = p3.y - p1.y;
	        var p3Len = Math.sqrt(dx * dx + dy * dy);
	        var p = (p1Len + p2Len + p3Len) / 2;
	        var v = p * (p - p1Len) * (p - p2Len) * (p - p3Len);
	        if (v > 0) {
	            return Math.sqrt(v);
	        }
	        return 0;
	    }
	}
	TestTriangle.baseTri = new TestTriangle;

	class SceneChar extends SceneBaseChar {
	    constructor() {
	        super();
	        this.speedTX = 1.5 / 20;
	        this.life = 0;
	        this.isMount = false;
	        this._px = 0;
	        this._py = 0;
	        this._pz = 0;
	        this._pRotationY = 0;
	        this._isBoss = false;
	        this._optimization = false; //当优化为true的时候 不显示
	        this._weaponNum = -1;
	        this._wingID = -1;
	        this.tittleHeight = 50;
	        this.toRotationY = 0;
	        this._resultVisible = true;
	        this._showHitBox = false;
	        // private triIndex: Array<number> = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]
	        // private triIndex: Array<number> = [0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0]
	        this.triIndex = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0];
	        this.shadow = true;
	        this.skillitem = new Array();
	    }
	    get isDeath() {
	        return false;
	    }
	    get isBoss() {
	        return this._isBoss;
	    }
	    set isBoss(val) {
	        this._isBoss = val;
	    }
	    get px() {
	        return this._px;
	    }
	    set px(val) {
	        this._px = val;
	        if (this.isMount) {
	            this.mountChar.x = val;
	            if (this._shadow) {
	                this._shadow.x = val;
	            }
	        }
	        else {
	            this.x = val;
	        }
	    }
	    get py() {
	        return this._py;
	    }
	    set py(val) {
	        this._py = val;
	        if (this.isMount) {
	            this.mountChar.y = val;
	            if (this._shadow) {
	                this._shadow.y = val;
	            }
	        }
	        else {
	            this.y = val;
	        }
	    }
	    get pz() {
	        return this._pz;
	    }
	    set pz(val) {
	        this._pz = val;
	        if (this.isMount) {
	            this.mountChar.z = val;
	            if (this._shadow) {
	                this._shadow.z = val;
	            }
	        }
	        else {
	            this.z = val;
	        }
	    }
	    /**强制角度 */
	    set forceRotationY(val) {
	        this.pRotationY = val;
	        this.rotationY = val;
	        this.toRotationY = val;
	    }
	    get pRotationY() {
	        return this._pRotationY;
	    }
	    set pRotationY(val) {
	        this._pRotationY = val;
	        if (this.isMount) {
	            this.mountChar.rotationY = val;
	        }
	        else {
	            this.rotationY = val;
	        }
	    }
	    play($action, $completeState = 0, needFollow = true) {
	        if (this.isSinging) {
	            $completeState = 0; //吟唱时动作状态成为2;
	            if ($action == CharAction.WALK || $action == CharAction.STANAD) {
	                return true;
	            }
	        }
	        if (this.isMount) {
	            this.mountChar.visible = Boolean($action != CharAction.JUMP);
	            if ($action == CharAction.STANAD) {
	                super.play(CharAction.STAND_MOUNT);
	            }
	            else if ($action == CharAction.WALK) {
	                super.play(CharAction.WALK_MOUNT);
	            }
	            else {
	                if (this.mountChar.visible) {
	                    super.play(CharAction.STAND_MOUNT);
	                }
	                else {
	                    super.play(CharAction.JUMP);
	                }
	            }
	            return this.mountChar.play($action, $completeState, needFollow);
	        }
	        else {
	            return super.play($action, $completeState, needFollow);
	        }
	        // if (this.unit && this.unit.isMain) {
	        //     if (this.isMount) {
	        //         //console.log("有坐骑")
	        //     } else {
	        //         //console.log("无坐骑") 
	        //     }
	        // }
	    }
	    getCurrentAction() {
	        if (this.isMount) {
	            return this.mountChar.curentAction;
	        }
	        else {
	            return this.curentAction;
	        }
	    }
	    getSceneCharAvatarUrl(num) {
	        if (num == 0) {
	            //console.log("衣服为0")
	            throw new Error("衣服为getSceneCharAvatarUrl");
	        }
	        var $url = UnitFunction.getRoleUrl(num);
	        return $url;
	    }
	    setMount() {
	    }
	    setWeapon(num) {
	        if (this._weaponNum == num) {
	            return;
	        }
	        this._weaponNum = num;
	        if (num <= 0) { //移除武器
	            this.removePart(SceneChar.WEAPON_PART);
	        }
	    }
	    setWeaponByAvatar(avatar, $suffix = "") {
	    }
	    addTestWeapon() {
	        this.addPart("test" + Math.random(), SceneChar.WEAPON_DEFAULT_SLOT, this.getSceneCharWeaponUrl(Math.random() > 0.5 ? 5202 : 5201));
	    }
	    onMeshLoaded() {
	        if (this._skinMesh) {
	            this.tittleHeight = this._skinMesh.tittleHeight;
	        }
	    }
	    set walkPath($wp) {
	        if ($wp.length == 0) {
	            return;
	        }
	        // //console.log("收到寻路信息",$wp,  TimeUtil.getTimer())
	        if (this.curentAction == CharAction.STANAD || this.curentAction == CharAction.STAND_MOUNT) {
	            this.play(CharAction.WALK);
	        }
	        this._walkPath = $wp;
	        this.setTarget();
	        this._speedDirect = null;
	    }
	    /*
	    public set walkPath2D($item: Array<Vector2D>) {
	        //if (this.unit) {
	        //    this.unit.sendPath($item);
	        //}
	      //  $item.splice(0, 1);
	        $item.shift()
	        this.applyWalk($item)
	    }
	    private setWalkPathFun($item: Array<Vector2D>, $bfun: Function = null): void {
	 
	        this.walkPath2D = $item;
	        this.walkCompleteBackFun = $bfun
	 
	    }
	    */
	    //得到A星数据后重新刷坐标
	    fixAstartData(pos) {
	        if (this._walkPath) {
	            for (var i = 0; i < this._walkPath.length; i++) {
	                this._walkPath[i].x += pos.x;
	                this._walkPath[i].z = pos.y - this._walkPath[i].z;
	                this._walkPath[i].y = AstarUtil.getHeightByPos(this._walkPath[i]);
	            }
	        }
	        this.px += pos.x;
	        this.pz = pos.y - this.pz;
	        if (this._astatTopos) {
	            this._astatTopos.x += pos.x;
	            this._astatTopos.z = pos.y - this._astatTopos.z;
	            this.setAstarNrmAndRotation();
	        }
	        this.refreshY();
	    }
	    applyWalk($item) {
	        if ($item && $item.length == 2) {
	            //排除是停止的路径将不处理
	            if ($item[0].x == $item[1].x && $item[0].y == $item[1].y) {
	                this._speedDirect = null;
	                this._walkPath = null;
	                if (this.curentAction == CharAction.WALK) {
	                    this.play(CharAction.STANAD);
	                }
	                var $k = AstarUtil.getWorldPosByStart2D($item[0]);
	                this.px = $k.x;
	                this.pz = $k.z;
	                return;
	            }
	        }
	        this.walkPath = AstarUtil.Path2dTo3d($item);
	    }
	    set moveToPos2D($v2d) {
	        // $v2d=new Vector2D(154,87)
	        this._walkPath = null;
	        this.play(this._defaultAction);
	        var pos = AstarUtil.getWorldPosByStart2D($v2d);
	        this.px = pos.x;
	        this.pz = pos.z;
	        this.refreshY();
	    }
	    stopToPos($v2d) {
	        var pos = AstarUtil.getWorldPosByStart2D($v2d);
	        var arr = new Array;
	        arr.push(pos);
	        this.walkPath = arr;
	    }
	    moveTile(xt, yt) {
	        this.moveToPos2D = new Vector2D(xt, yt);
	    }
	    refreshY() {
	        this.py = AstarUtil.getHeightByPos(this.getCurrentPos());
	    }
	    refreshHP() {
	    }
	    //平滑num=1为直接
	    rotationToNew(value, num = 1) {
	        var anum = value - this.pRotationY;
	        if (anum == 0) {
	            return;
	        }
	        if (anum < 1) {
	            this.pRotationY = value;
	            return;
	        }
	        var a = ((value - this.pRotationY) % 360 + 360) % 360;
	        if (a > 180) {
	            this.pRotationY -= (360 - a) / num;
	        }
	        else {
	            this.pRotationY += a / num;
	        }
	    }
	    //设计毫秒走每个格子，
	    set speedUseTime(value) {
	        // this.speed = 0.01 * (1000 / (value))
	        this.speedTX = 0.01 * (value / 10);
	        ////console.log(this.speedTX )
	    }
	    refreshSpeed() {
	        this.speedUseTime = 1;
	    }
	    walkAstar(t) {
	        // if (this.unit && this.unit.isMain) {
	        // }
	        var $wk = Math.min(t, 50);
	        var distance = Vector3D.distance(new Vector3D(this.px, 0, this.pz), this._astatTopos);
	        if (distance > 5) {
	            var sn = $wk * this.speedTX;
	            if (sn > distance) {
	                this.px = this._astatTopos.x;
	                this.pz = this._astatTopos.z;
	                var tempT = (sn - distance) / this.speedTX;
	                this.walkAstar(tempT);
	            }
	            else {
	                this.px += this._astarDirect.x * sn;
	                this.pz += this._astarDirect.z * sn;
	            }
	        }
	        else {
	            this.setTarget();
	            if (!this._walkPath) { //已结束
	                this.px = this._astatTopos.x;
	                this.pz = this._astatTopos.z;
	                this.walkComplete();
	            }
	            else {
	                this.walkAstar(t);
	            }
	        }
	    }
	    walkComplete() {
	        if (this.walkCompleteBackFun) {
	            this.walkCompleteBackFun();
	        }
	    }
	    setTarget() {
	        if (!this._walkPath) {
	            return;
	        }
	        if (this._walkPath.length == 0) {
	            this._walkPath = null;
	            this.play(CharAction.STANAD);
	            return;
	        }
	        this._astatTopos = this._walkPath.shift();
	        this.setAstarNrmAndRotation();
	    }
	    //计算移动角度和寻路方向 
	    setAstarNrmAndRotation() {
	        if (this._astatTopos) {
	            this._astarDirect = this._astatTopos.subtract(this.getCurrentPos());
	            this._astarDirect.y = 0;
	            this._astarDirect.normalize();
	            if (Vector3D.distance(this.getCurrentPos(), this._astatTopos) > 10) {
	                this.toRotationY = this.mathAngle(this._astatTopos.z, this._astatTopos.x, this.pz, this.px) + 180;
	            }
	        }
	    }
	    mathAngle(x1, y1, x2, y2) {
	        return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
	    }
	    setSpeedDirect(value) {
	        if (this.isDeath) {
	            return;
	        }
	        this._speedDirect = value;
	        if (this.curentAction == CharAction.STANAD || this.curentAction == CharAction.STAND_MOUNT) {
	            this.play(CharAction.WALK);
	        }
	        this._walkPath = null;
	    }
	    stopMove() {
	        this._speedDirect = null;
	        this._walkPath = null;
	        this.play(CharAction.STANAD);
	    }
	    getEndWalkPathPos() {
	        if (this._walkPath) {
	            return this._walkPath[this._walkPath.length - 1];
	        }
	        else {
	            return null;
	        }
	    }
	    watch($obj, $syn = false) {
	        if (!$obj) {
	            //console.log("面向对象无")
	            return;
	        }
	        var xx = $obj.x - this.px;
	        var yy = $obj.z - this.pz;
	        var distance = Math.sqrt(xx * xx + yy * yy);
	        xx /= distance;
	        yy /= distance;
	        var angle = Math.asin(xx) / Math.PI * 180;
	        if (yy <= 0) {
	            angle = 180 - angle;
	        }
	        if (!isNaN(angle)) {
	            this.forceRotationY = angle;
	        }
	    }
	    getCurrentPos() {
	        return new Vector3D(this.px, this.py, this.pz);
	    }
	    getAstarPos() {
	        return AstarUtil.getGrapIndexByPos(this.getCurrentPos());
	    }
	    changeAction($action) {
	        {
	            switch ($action) {
	                case CharAction.ATTACK_01:
	                    this.play(CharAction.ATTACK_010, 2);
	                    break;
	                case CharAction.ATTACK_02:
	                    this.play(CharAction.ATTACK_020, 2);
	                    break;
	                default:
	                    super.changeAction($action);
	                    break;
	            }
	        } /* else {
	            super.changeAction($action)
	        } */
	    }
	    playSkill($skill) {
	        this._walkPath = null;
	        SkillManager.getInstance().playSkill($skill);
	        this.skillVo = $skill;
	    }
	    msgSpellStop() {
	        if (this.skillVo) {
	            ////console.log("停止技能播放");
	            this.skillVo.removeSkillForce();
	            this.changeAction(this._defaultAction);
	            this.skillVo = null;
	        }
	        this.isSinging = false;
	    }
	    //清理等待播放的连击技能
	    destory() {
	        if (this._hasDestory) {
	            return;
	        }
	        super.destory();
	        if (this._isBoss) ;
	        if (this.skillVo) {
	            this.skillVo.removeSkillForce();
	            this.skillVo = null;
	        }
	        if (this._wingDisplay) {
	            this._wingDisplay.destory();
	        }
	        this._hasDestory = true;
	    }
	    removeStage() {
	        super.removeStage();
	        if (this.mountChar) {
	            SceneManager.getInstance().removeMovieDisplay(this.mountChar);
	        }
	        if (this._wingDisplay) {
	            SceneManager.getInstance().removeMovieDisplay(this._wingDisplay);
	        }
	    }
	    addStage() {
	        super.addStage();
	        if (this.mountChar) {
	            SceneManager.getInstance().addMovieDisplay(this.mountChar);
	        }
	        if (this._wingDisplay) {
	            SceneManager.getInstance().addMovieDisplay(this._wingDisplay);
	        }
	    }
	    math_distance($other) {
	        return MathClass.math_distance(this.px, this.pz, $other.x, $other.z);
	    }
	    set visible(value) {
	        this._visible = value;
	        this.applyVisible();
	    }
	    get visible() {
	        return this._visible;
	    }
	    set optimization(value) {
	        this._optimization = value;
	        this.applyVisible();
	    }
	    get optimization() {
	        return this._optimization;
	    }
	    get resultVisible() {
	        return this._resultVisible;
	    }
	    applyVisible() {
	        var value = this._visible;
	        if (this._visible) {
	            if (this._optimization) {
	                value = false;
	            }
	            else {
	                value = true;
	            }
	        }
	        else {
	            value = false;
	        }
	        if (this._partDic) {
	            if (this._partDic[SceneChar.WEAPON_PART]) {
	                for (var obj of this._partDic[SceneChar.WEAPON_PART]) {
	                    obj.sceneVisible = value;
	                }
	            }
	        }
	        if (this._wingDisplay) {
	            this._wingDisplay.visible = value;
	        }
	        /*
	        if (this._charBloodVo) {
	            this._charBloodVo.visible = value
	        }
	        if (this._charNameVo) {
	            this._charNameVo.visible = value
	        }
	        if (this._factionNameVo) {
	            this._factionNameVo.visible = value
	        }
	        if (this._charTitleVo) {
	            this._charTitleVo.visible = value
	        }
	        */
	        this.shadow = value;
	        this._resultVisible = value;
	    }
	    update() {
	        if (!this._skinMesh) {
	            return;
	        }
	        if (this._optimization) {
	            return;
	        }
	        super.update();
	        if (this._showHitBox) {
	            if (!this.lineSprite) {
	                ProgramManager.getInstance().registe(LineDisplayShader.LineShader, new LineDisplayShader);
	                this.lineSprite = new LineDisplaySprite();
	                this.lineSprite.clear();
	                for (var i = 0; i < this.triIndex.length / 3; i++) {
	                    var a = this._skinMesh.hitPosItem[this.triIndex[i * 3 + 0]];
	                    var b = this._skinMesh.hitPosItem[this.triIndex[i * 3 + 1]];
	                    var c = this._skinMesh.hitPosItem[this.triIndex[i * 3 + 2]];
	                    this.lineSprite.makeLineMode(a, b);
	                    this.lineSprite.makeLineMode(b, c);
	                    this.lineSprite.makeLineMode(c, a);
	                }
	                this.lineSprite.upToGpu();
	            }
	            this.lineSprite.posMatrix = this.posMatrix.clone();
	            this.lineSprite.update();
	        }
	    }
	    mouseClik($lineA, $lineB) {
	        var $pos = Scene_data.cam3D.cameraMatrix.transformVector(this.getCurrentPos());
	        if ($pos.z < Scene_data.cam3D.distance / 3) { //在Z后面
	            return null;
	        }
	        var hitVec2 = MathUtil.math3DWorldtoDisplay2DPos($lineB);
	        if (this._skinMesh) {
	            if (!this.hitBox2DItem) {
	                this.hitBox2DItem = new Array;
	            }
	            this.hitBox2DItem.length = 0;
	            for (var j = 0; j < this._skinMesh.hitPosItem.length; j++) {
	                var temppp = this.posMatrix.transformVector(this._skinMesh.hitPosItem[j]);
	                this.hitBox2DItem.push(MathUtil.math3DWorldtoDisplay2DPos(temppp));
	            }
	            for (var i = 0; i < this.triIndex.length / 3; i++) {
	                TestTriangle.baseTri.p1 = this.hitBox2DItem[this.triIndex[i * 3 + 0]];
	                TestTriangle.baseTri.p2 = this.hitBox2DItem[this.triIndex[i * 3 + 1]];
	                TestTriangle.baseTri.p3 = this.hitBox2DItem[this.triIndex[i * 3 + 2]];
	                if (TestTriangle.baseTri.checkPointIn(hitVec2)) {
	                    return true;
	                }
	            }
	        }
	        else {
	            if (Vector2D.distance(hitVec2, MathUtil.math3DWorldtoDisplay2DPos(this.posMatrix.position)) < 20) {
	                return true;
	            }
	        }
	        return false;
	    }
	}
	SceneChar.WEAPON_PART = "weapon";
	SceneChar.WEAPON_DEFAULT_SLOT = "w_01";
	SceneChar.MOUNT_SLOT = "mount_01";
	SceneChar.WING_SLOT = "wing_01";
	SceneChar.SEL_PART = "select";
	SceneChar.QUEST_ICON = "questicon";
	SceneChar.NONE_SLOT = "none";
	SceneChar.Defaul_Man_Avatar = 2002; //男
	SceneChar.Defaul_WoMan_Avater = 2012; //女

	class ColorType {
	}
	ColorType.Orange7a2f21 = "[7a2f21]"; //桔
	ColorType.Orange9a683f = "[9a683f]"; //
	ColorType.Orange853d07 = "[853d07]"; //桔
	ColorType.Brown6a4936 = "[6a4936]"; //深棕
	ColorType.Brown623424 = "[623424]"; //深棕
	ColorType.Brownac8965 = "[ac8965]";
	ColorType.Reddb4051 = "[db4051]"; //红
	ColorType.Redd92200 = "[d92200]"; //红
	ColorType.Redff0000 = "[ff0000]"; //红
	ColorType.Brownd8d49c = "[d8d49c]"; //棕
	ColorType.color843b11 = "[843b11]"; //棕
	ColorType.colorb96d49 = "[b96d49]"; //棕
	ColorType.colorcd2000 = "[cd2000]"; //棕
	ColorType.colorfef3d7 = "[fef3d7]"; //棕
	ColorType.color9a683f = "[9a683f]"; //棕
	ColorType.Brown7a2f21 = "[7a2f21]"; //棕
	ColorType.Brown40120a = "[40120a]"; //棕
	ColorType.Brown491207 = "[491207]"; //棕
	ColorType.Brown541616 = "[541616]"; //棕
	ColorType.Brown5a2610 = "[5a2610]"; //棕
	ColorType.Browndf9a68 = "[df9a68]";
	ColorType.Browndb39264 = "[b39264]";
	ColorType.Brownd662c0d = "[662c0d]";
	ColorType.colorefe4c4 = "[efe4c4]";
	ColorType.color802626 = "[802626]";
	ColorType.color9f7b4d = "[9f7b4d]";
	ColorType.color4b0808 = "[4b0808]";
	ColorType.color5f5c59 = "[5f5c59]";
	ColorType.color903713 = "[903713]";
	ColorType.colorfdf6da = "[fdf6da]";
	ColorType.color73301c = "[73301c]";
	ColorType.colorffeeb5 = "[ffeeb5]";
	ColorType.Green98ec2c = "   "; //绿
	ColorType.Green56da35 = "[56da35]"; //绿
	ColorType.Green20a200 = "[20a200]"; //绿
	ColorType.Greenadff00 = "[adff00]"; //绿
	ColorType.Green2ca937 = "[2ca937]"; //绿
	ColorType.Green464b11 = "[464b11]"; //绿
	ColorType.Green54db36 = "[54db36]"; //绿
	ColorType.Yellowf7d253 = "[f7d253]"; //黄
	ColorType.Yellowffecc6 = "[ffecc6]"; //黄
	ColorType.Yellowffd500 = "[ffd500]"; //黄
	ColorType.Yellowffe9b4 = "[ffe9b4]"; //黄
	ColorType.Yellowedce7e = "[edce7e]"; //黄
	ColorType.color4c1c07 = "[4c1c07]";
	ColorType.Whiteffffff = "[ffffff]"; //白
	ColorType.Whitefffce6 = "[fffce6]"; //白
	ColorType.Whitefff7db = "[fff7db]"; //白
	ColorType.White9A683F = "[9A683F]"; //白
	ColorType.Black000000 = "[000000]"; //黑
	ColorType.Whitefff4d6 = "[fff4d6]"; //白
	ColorType.Whiteffeed0 = "[ffeed0]"; //白
	ColorType.Whiteffeec9 = "[ffeec9]"; //白
	ColorType.Whiteffe9b4 = "[ffe9b4]"; //白
	ColorType.Whitefff0b4 = "[fff0b4]"; //白
	ColorType.Coffeeff9200 = "[ff9200]"; //橙黄
	ColorType.Coffeefee87b = "[fee87b]"; //橙黄
	ColorType.color2daa35 = "[2daa35]"; //绿
	ColorType.color4392ff = "[4392ff]"; //蓝
	ColorType.colorb759ff = "[b759ff]"; //紫
	ColorType.colorff7200 = "[ff7200]"; //桔
	ColorType.colorce0a00 = "[ce0a00]"; //红
	ColorType.coloraa874a = "[aa874a]"; //红
	ColorType.colorffecc6 = "[ffecc6]"; //红
	ColorType.colorfde87e = "[fde87e]"; //红
	ColorType.colord6e7ff = "[d6e7ff]"; //红"#"
	ColorType.colord27262e = "[27262e]";
	ColorType.colorffe9b4 = "[ffe9b4]";
	ColorType.color9c9b9b = "[9c9b9b]";
	ColorType.colorfff2d3 = "[fff2d3]";
	ColorType.color451800 = "[451800]";

	class BaseDiplay3dShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "u2Texture");
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec3 v3Position;" +
	            "attribute vec2 u2Texture;" +
	            "uniform mat4 viewMatrix3D;" +
	            "uniform mat4 camMatrix3D;" +
	            "uniform mat4 posMatrix3D;" +
	            "varying vec2 v_texCoord;" +
	            "void main(void)" +
	            "{" +
	            "   v_texCoord = vec2(u2Texture.x, u2Texture.y);" +
	            "   vec4 vt0= vec4(v3Position, 1.0);" +
	            "   vt0 = posMatrix3D * vt0;" +
	            "   vt0 = camMatrix3D * vt0;" +
	            "   vt0 = viewMatrix3D * vt0;" +
	            "   gl_Position = vt0;" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = "precision mediump float;\n" +
	            "uniform sampler2D s_texture;\n" +
	            "varying vec2 v_texCoord;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(s_texture, v_texCoord.xy);\n" +
	            "gl_FragColor =infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	BaseDiplay3dShader.BaseDiplay3dShader = "BaseDiplay3dShader";
	class BaseDiplay3dSprite extends Display3D {
	    constructor() {
	        super();
	        this.initData();
	        this.updateMatrix;
	    }
	    initData() {
	        ProgramManager.getInstance().registe(BaseDiplay3dShader.BaseDiplay3dShader, new BaseDiplay3dShader);
	        this.shader = ProgramManager.getInstance().getProgram(BaseDiplay3dShader.BaseDiplay3dShader);
	        this.program = this.shader.program;
	        this.objData = new ObjData;
	        this.objData.vertices = new Array();
	        this.objData.vertices.push(0, 0, 0);
	        this.objData.vertices.push(100, 0, 0);
	        this.objData.vertices.push(100, 0, 100);
	        this.objData.uvs = new Array();
	        this.objData.uvs.push(0, 0);
	        this.objData.uvs.push(1, 0);
	        this.objData.uvs.push(0, 1);
	        this.objData.indexs = new Array();
	        this.objData.indexs.push(0, 1, 2);
	        this.loadTexture();
	        this.upToGpu();
	    }
	    loadTexture() {
	        var $ctx = UIManager.getInstance().getContext2D(128, 128, false);
	        $ctx.fillStyle = "rgb(255,255,255)";
	        $ctx.fillRect(0, 0, 128, 128);
	        this._uvTextureRes = TextureManager.getInstance().getCanvasTexture($ctx);
	    }
	    upToGpu() {
	        if (this.objData.indexs.length) {
	            this.objData.treNum = this.objData.indexs.length;
	            this.objData.vertexBuffer = Scene_data.context3D.uploadBuff3D(this.objData.vertices);
	            this.objData.uvBuffer = Scene_data.context3D.uploadBuff3D(this.objData.uvs);
	            this.objData.indexBuffer = Scene_data.context3D.uploadIndexBuff3D(this.objData.indexs);
	        }
	    }
	    update() {
	        if (this.objData && this.objData.indexBuffer && this._uvTextureRes) {
	            Scene_data.context3D.setProgram(this.program);
	            Scene_data.context3D.setVcMatrix4fv(this.shader, "viewMatrix3D", Scene_data.viewMatrx3D.m);
	            Scene_data.context3D.setVcMatrix4fv(this.shader, "camMatrix3D", Scene_data.cam3D.cameraMatrix.m);
	            Scene_data.context3D.setVcMatrix4fv(this.shader, "posMatrix3D", this.posMatrix.m);
	            Scene_data.context3D.setVa(0, 3, this.objData.vertexBuffer);
	            Scene_data.context3D.setVa(1, 2, this.objData.uvBuffer);
	            Scene_data.context3D.setRenderTexture(this.shader, "s_texture", this._uvTextureRes.texture, 0);
	            Scene_data.context3D.drawCall(this.objData.indexBuffer, this.objData.treNum);
	        }
	    }
	}

	class ModelRes extends BaseRes {
	    load(url, $fun) {
	        this._fun = $fun;
	        LoadManager.getInstance().load(url, LoadManager.BYTE_TYPE, ($byte) => {
	            this.loadComplete($byte);
	        });
	    }
	    loadComplete($byte) {
	        this._byte = new Pan3dByteArray($byte);
	        this._byte.position = 0;
	        this.read(() => { this.readNexte(); }); //img
	    }
	    readNexte() {
	        this.read(); //obj
	        this.read(); //material
	        this.objUrl = this._byte.readUTF();
	        this.materialUrl = this._byte.readUTF();
	        if (this._byte.readBoolean()) {
	            this.light = new LightVo();
	            this.light.ambientColor[0] = this._byte.readFloat();
	            this.light.ambientColor[1] = this._byte.readFloat();
	            this.light.ambientColor[2] = this._byte.readFloat();
	            this.light.sunColor[0] = this._byte.readFloat();
	            this.light.sunColor[1] = this._byte.readFloat();
	            this.light.sunColor[2] = this._byte.readFloat();
	            this.light.sunDirect[0] = this._byte.readFloat();
	            this.light.sunDirect[1] = this._byte.readFloat();
	            this.light.sunDirect[2] = this._byte.readFloat();
	        }
	        this._fun();
	    }
	}

	class Display3DUISprite extends Display3DSprite {
	    constructor() {
	        super();
	        this.uiMatrix = new Matrix3D;
	        this.uiMatrix.prependTranslation(0, 0, 600);
	        this.uiMatrix.prependRotation(-15, Vector3D.X_AXIS);
	        this.uiMatrix.prependRotation(0, Vector3D.Y_AXIS);
	        this.uiViewMatrix = new Matrix3D;
	    }
	    loadRes($name) {
	        if (!this.modelRes) {
	            this.modelRes = new ModelRes();
	        }
	        this.modelRes.load(Scene_data.fileRoot + UnitFunction.getModelUrl($name), () => { this.loadResComFinish(); });
	    }
	    loadResComFinish() {
	        this.setObjUrl(this.modelRes.objUrl);
	        this.setMaterialUrl(this.modelRes.materialUrl);
	    }
	    loadGroup($name) {
	        var groupRes = new GroupRes;
	        groupRes.load(Scene_data.fileRoot + "model/" + $name + ".txt", () => { this.loadPartRes(groupRes); });
	    }
	    loadPartRes(groupRes) {
	        for (var i = 0; i < groupRes.dataAry.length; i++) {
	            var item = groupRes.dataAry[i];
	            if (item.types == BaseRes.SCENE_PARTICLE_TYPE) ;
	            else if (item.types == BaseRes.PREFAB_TYPE) {
	                this.setObjUrl(item.objUrl);
	                this.setMaterialUrl(item.materialUrl, item.materialInfoArr);
	            }
	        }
	    }
	    resize() {
	        this.uiViewMatrix.identity();
	        this.uiViewMatrix.perspectiveFieldOfViewLH(1, 1, 500, 5000);
	        this.uiViewMatrix.appendScale(1000 / Scene_data.stageWidth, 1000 / Scene_data.stageHeight, 1);
	    }
	    setCam() {
	        //Scene_data.context3D.setVcMatrix4fv(this.material.shader, "posMatrix3D", this.posMatrix.m);
	        Scene_data.context3D.setVcMatrix4fv(this.material.shader, "viewMatrix3D", this.uiViewMatrix.m);
	        Scene_data.context3D.setVcMatrix4fv(this.material.shader, "camMatrix3D", this.uiMatrix.m);
	    }
	    update() {
	        Scene_data.context3D.setWriteDepth(true);
	        Scene_data.context3D.setDepthTest(true);
	        super.update();
	        Scene_data.context3D.setWriteDepth(false);
	        Scene_data.context3D.setDepthTest(false);
	        ////console.log(this.posMatrix.m)
	    }
	}

	class FpsMc {
	    constructor() {
	        this.drawNum = 0;
	        this.fpsStr = "";
	    }
	    static update() {
	    }
	    getStr() {
	        {
	            // FpsMc.fpsNowNum = Math.min(this.drawNum + float2int(this.drawNum / 10 * FpsMc.addFps), 60)
	            FpsMc.fpsNowNum = Math.min(this.drawNum, 600);
	            this.fpsStr = "Fps:" + String(FpsMc.fpsNowNum) + "-" + FpsMc.tipStr;
	        }
	        return this.fpsStr;
	    }
	}
	FpsMc.addFps = 0;
	FpsMc.fpsNowNum = 0;
	FpsMc.tipStr = "";
	class FpsStage {
	    constructor() {
	        this.lastTime = 0;
	        this.cPos = new Vector2D(150, 100);
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new FpsStage();
	        }
	        return this._instance;
	    }
	    init($cadves, $loadCav) {
	        this.canvas2D = $cadves;
	        this.loadCav = $loadCav;
	        this.fps = new FpsMc();
	        this.canvasUi = this.canvas2D.getContext("2d");
	        this.loadCtx = this.loadCav.getContext("2d");
	        TimeUtil.addFrameTick(() => { this.upData(); });
	    }
	    showLoadInfo(str) {
	        /*
	        this.loadCtx.clearRect(0, 0, this.loadCav.width, this.loadCav.height);
	        this.loadCtx.font = "40px Helvetica";
	        this.loadCtx.fillStyle = "#ffffff";
	        this.loadCtx.textBaseline = "top";
	        this.loadCtx.textAlign = "left";
	        this.loadCtx.fillText(str, 0, 0);
	 
	        */
	    }
	    removeShowLoad() {
	        if (this.loadCav.parentElement) {
	            this.loadCav.parentElement.removeChild(this.loadCav);
	        }
	        FpsStage.showFps = true;
	    }
	    upData() {
	        this.fps.drawNum++;
	        if (this.lastTime >= TimeUtil.getTimer() - 1000) {
	            return;
	        }
	        this.lastTime = TimeUtil.getTimer();
	        if (!FpsStage.showFps) {
	            this.canvasUi.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);
	            return;
	        }
	        this.canvasUi.font = "40px Helvetica";
	        var wNum = this.canvasUi.measureText(this.fps.getStr()).width;
	        this.canvas2D.width = wNum;
	        this.canvas2D.height = 30;
	        this.canvasUi.clearRect(50, 0, this.canvas2D.width - 50, this.canvas2D.height);
	        this.canvasUi.fillStyle = "#000000"; // text color
	        this.canvasUi.fillRect(50, 0, this.canvas2D.width - 50, this.canvas2D.height);
	        this.canvasUi.font = "30px Helvetica";
	        this.canvasUi.fillStyle = "#ffffff"; // text color
	        this.canvasUi.textBaseline = "top"; //TextAlign.TOP;
	        this.canvasUi.textAlign = "left"; //TextAlign.LEFT;
	        this.canvasUi.fillText(this.fps.getStr(), 50, 0);
	        this.fps.drawNum = 0;
	    }
	    makeXyzLine() {
	        var xPos = new Vector3D(80, 0, 0);
	        var yPos = new Vector3D(0, 70, 0);
	        var zPos = new Vector3D(0, 0, 80);
	        var $m = new Matrix3D;
	        $m.appendRotation(Scene_data.cam3D.rotationY, Vector3D.Y_AXIS);
	        $m.appendRotation(Scene_data.cam3D.rotationX, Vector3D.X_AXIS);
	        xPos = $m.transformVector(xPos);
	        yPos = $m.transformVector(yPos);
	        zPos = $m.transformVector(zPos);
	        this.drawLine(new Vector2D(0, 0), new Vector2D(xPos.x, -xPos.y), "#ff0000");
	        this.drawLine(new Vector2D(0, 0), new Vector2D(yPos.x, -yPos.y), "#00ff00");
	        this.drawLine(new Vector2D(0, 0), new Vector2D(zPos.x, -zPos.y), "#0000ff");
	        this.canvasUi.font = "12px Helvetica";
	        this.canvasUi.fillStyle = "#ff0000"; // text color
	        this.canvasUi.fillText("x", xPos.x + this.cPos.x, -xPos.y + this.cPos.y);
	        this.canvasUi.fillStyle = "#00ff00"; // text color
	        this.canvasUi.fillText("y", yPos.x + this.cPos.x, -yPos.y + this.cPos.y);
	        this.canvasUi.fillStyle = "#0000ff"; // text color
	        this.canvasUi.fillText("z", zPos.x + this.cPos.x, -zPos.y + this.cPos.y);
	    }
	    drawLine(a, b, $color = "red") {
	        this.canvasUi.beginPath();
	        this.canvasUi.lineWidth = 2;
	        this.canvasUi.strokeStyle = $color;
	        this.canvasUi.moveTo(a.x + this.cPos.x, a.y + this.cPos.y);
	        this.canvasUi.lineTo(b.x + this.cPos.x, b.y + this.cPos.y);
	        this.canvasUi.stroke();
	    }
	    resetSize() {
	        this.cPos = new Vector2D(150, Scene_data.stageHeight - 100);
	    }
	}
	FpsStage.showFps = false;

	class TextureCube {
	}

	class BuildShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "v2CubeTexST");
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec3 v3Position;" +
	            "attribute vec2 v2CubeTexST;" +
	            //"attribute vec2 v2LightBuff;" +
	            "uniform mat4 viewMatrix3D;" +
	            "uniform mat4 camMatrix3D;" +
	            "uniform mat4 posMatrix3D;" +
	            "varying vec2 v_texCoord;" +
	            //"varying vec2 v_texLight;" +
	            "void main(void)" +
	            "{" +
	            "   v_texCoord = vec2(v2CubeTexST.x, v2CubeTexST.y);" +
	            //"   v_texLight = vec2(v2LightBuff.x, v2LightBuff.y);" +
	            "   vec4 vt0= vec4(v3Position, 1.0);" +
	            "   vt0 = posMatrix3D * vt0;" +
	            "   vt0 = camMatrix3D * vt0;" +
	            "   vt0 = viewMatrix3D * vt0;" +
	            "   gl_Position = vt0;" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = 
	        //"#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
	        //"precision highp float;\n" +
	        //" #else\n" +
	        " precision mediump float;\n" +
	            //" #endif\n" +
	            "uniform sampler2D s_texture;\n" +
	            //"uniform sampler2D light_texture;\n" +
	            "uniform vec4 testconst;" +
	            "uniform vec4 testconst2;" +
	            "varying vec2 v_texCoord;\n" +
	            //"varying vec2 v_texLight;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(s_texture, v_texCoord.xy);\n" +
	            //"if (infoUv.a <= 0.9) {\n" +
	            //"     discard;\n" +
	            //"}\n" +
	            //"vec4 infoLight = texture2D(light_texture, v_texLight);\n" +
	            //"vec4 test = vec4(0.5,0,0,1);\n" +
	            "vec4 test = vec4(0,0,0,1);\n" +
	            "test.xyz = mix(vec3(1,1,1)*0.5,testconst.xyz,0.5);\n" +
	            //"test = test * testconst2;\n" +
	            "infoUv.xyz = test.xyz * infoUv.xyz;\n" +
	            //"info.rgb = info.rgb / 0.15;\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	BuildShader.buildShader = "BuildShader";

	class MaterialBatchAnimShader extends Shader3D {
	    constructor() {
	        super();
	        this.name = "Material_Batch_Anim_Shader";
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "pos");
	        $context.bindAttribLocation(this.program, 1, "v2Uv");
	        $context.bindAttribLocation(this.program, 2, "boneID");
	        $context.bindAttribLocation(this.program, 3, "boneWeight");
	        var usePbr = this.paramAry[0];
	        var useNormal = this.paramAry[1];
	        var lightProbe = this.paramAry[4];
	        var directLight = this.paramAry[5];
	        if (usePbr) {
	            $context.bindAttribLocation(this.program, 4, "normal");
	            if (useNormal) {
	                $context.bindAttribLocation(this.program, 5, "tangent");
	                $context.bindAttribLocation(this.program, 6, "bitangent");
	            }
	        }
	        else if (lightProbe || directLight) {
	            $context.bindAttribLocation(this.program, 4, "normal");
	        }
	    }
	    getVertexShaderString() {
	        var usePbr = this.paramAry[0];
	        var useNormal = this.paramAry[1];
	        var hasFresnel = this.paramAry[2];
	        var useDynamicIBL = this.paramAry[3];
	        var lightProbe = this.paramAry[4];
	        var directLight = this.paramAry[5];
	        var noLight = this.paramAry[6];
	        var $str = "precision mediump float;\n" +
	            "attribute vec4 pos;\n" +
	            "attribute vec3 v2Uv;\n" +
	            "attribute vec4 boneID;\n" +
	            "attribute vec4 boneWeight;\n" +
	            "varying vec2 v0;\n" +
	            "uniform mat4 bone[19];\n" +
	            "uniform mat4 viewMatrix3D;\n" +
	            "uniform mat4 camMatrix3D;\n" +
	            "uniform mat4 posMatrixAry[6];\n";
	        if (lightProbe) {
	            $str +=
	                "varying vec3 v2;\n";
	        }
	        else if (directLight) {
	            $str +=
	                "uniform vec3 sunDirect;\n" +
	                    "uniform vec3 sunColor;\n" +
	                    "uniform vec3 ambientColor;\n" +
	                    "varying vec3 v2;\n";
	        }
	        else if (noLight) ;
	        else {
	            $str +=
	                "varying vec2 v2;\n";
	        }
	        if (usePbr) {
	            $str +=
	                "attribute vec4 normal;\n" +
	                    "uniform mat4 rotationMatrix3D;\n" +
	                    "varying vec3 v1;\n";
	            if (!useNormal) {
	                $str += "varying vec3 v4;\n";
	            }
	            else {
	                $str += "varying mat3 v4;\n";
	            }
	            if (useNormal) {
	                $str +=
	                    "attribute vec4 tangent;\n" +
	                        "attribute vec4 bitangent;\n";
	            }
	        }
	        else if (lightProbe || directLight) {
	            $str +=
	                "attribute vec4 normal;\n" +
	                    "uniform mat4 rotationMatrix3D;\n";
	        }
	        $str +=
	            "void main(void){\n" +
	                "v0 = vec2(v2Uv.xy);\n" +
	                "vec4 vt0 = bone[int(boneID.x)] * pos * boneWeight.x;\n" +
	                "vt0 += bone[int(boneID.y)] * pos * boneWeight.y;\n" +
	                "vt0 += bone[int(boneID.z)] * pos * boneWeight.z;\n" +
	                "vt0 += bone[int(boneID.w)] * pos * boneWeight.w;\n" +
	                "vt0 = posMatrixAry[int(v2Uv.z)] * vt0;\n";
	        if (usePbr) {
	            $str +=
	                "v1 = vec3(vt0.x,vt0.y,vt0.z);\n";
	        }
	        $str +=
	            "vt0 = camMatrix3D * vt0;\n" +
	                "vt0 = viewMatrix3D * vt0;\n" +
	                "gl_Position = vt0;\n";
	        if (usePbr) {
	            if (!useNormal) {
	                $str +=
	                    "vt0 = bone[int(boneID.x)] * normal * boneWeight.x;\n" +
	                        "vt0 += bone[int(boneID.y)] * normal * boneWeight.y;\n" +
	                        "vt0 += bone[int(boneID.z)] * normal * boneWeight.z;\n" +
	                        "vt0 += bone[int(boneID.w)] * normal * boneWeight.w;\n" +
	                        "vt0 = rotationMatrix3D * vt0;\n" +
	                        "vt0.xyz = normalize(vt0.xyz);\n" +
	                        "v4 = vec3(vt0.x,vt0.y,vt0.z);\n";
	            }
	            else {
	                $str +=
	                    "vec4 vt2 = bone[int(boneID.x)] * tangent * boneWeight.x;\n" +
	                        "vt2 += bone[int(boneID.y)] * tangent * boneWeight.y;\n" +
	                        "vt2 += bone[int(boneID.z)] * tangent * boneWeight.z;\n" +
	                        "vt2 += bone[int(boneID.w)] * tangent * boneWeight.w;\n" +
	                        "vt2 = rotationMatrix3D * vt2;\n" +
	                        "vt2.xyz = normalize(vt2.xyz);\n" +
	                        "vec4 vt1 = bone[int(boneID.x)] * bitangent * boneWeight.x;\n" +
	                        "vt1 += bone[int(boneID.y)] * bitangent * boneWeight.y;\n" +
	                        "vt1 += bone[int(boneID.z)] * bitangent * boneWeight.z;\n" +
	                        "vt1 += bone[int(boneID.w)] * bitangent * boneWeight.w;\n" +
	                        "vt1 = rotationMatrix3D * vt1;\n" +
	                        "vt1.xyz = normalize(vt1.xyz);\n" +
	                        "vt0 = bone[int(boneID.x)] * normal * boneWeight.x;\n" +
	                        "vt0 += bone[int(boneID.y)] * normal * boneWeight.y;\n" +
	                        "vt0 += bone[int(boneID.z)] * normal * boneWeight.z;\n" +
	                        "vt0 += bone[int(boneID.w)] * normal * boneWeight.w;\n" +
	                        "vt0 = rotationMatrix3D * vt0;\n" +
	                        "vt0.xyz = normalize(vt0.xyz);\n" +
	                        "v4 = mat3(vec3(vt2.x,vt2.y,vt2.z),vec3(vt1.x,vt1.y,vt1.z),vec3(vt0.x,vt0.y,vt0.z));\n";
	            }
	        }
	        else if (lightProbe || directLight) {
	            $str +=
	                "vt0 = bone[int(boneID.x)] * normal * boneWeight.x;\n" +
	                    "vt0 += bone[int(boneID.y)] * normal * boneWeight.y;\n" +
	                    "vt0 += bone[int(boneID.z)] * normal * boneWeight.z;\n" +
	                    "vt0 += bone[int(boneID.w)] * normal * boneWeight.w;\n" +
	                    "vt0 = rotationMatrix3D * vt0;\n" +
	                    "vt0.xyz = normalize(vt0.xyz);\n";
	            //"vt0 = vec4(0,1,0,1);\n";
	        }
	        if (lightProbe) {
	            $str +=
	                "vec3 lpb = normalize(vec3(1.0,1.0,-1.0));\n" +
	                    "float lp = min(0.0,dot(lpb,vec3(vt0.xyz)));\n" +
	                    "lp = lp * 2.0 + 0.7;\n" +
	                    "v2 = vec3(lp,lp,lp);\n";
	        }
	        else if (directLight) {
	            $str +=
	                "float suncos = dot(vt0.xyz,sunDirect.xyz);\n" +
	                    "suncos = clamp(suncos,0.0,1.0);\n" +
	                    "v2 = sunColor * suncos + ambientColor;";
	            //"v2 = sunColor * suncos;"
	        }
	        else if (noLight) ;
	        else {
	            $str +=
	                "v2 = v2Uv;\n";
	        }
	        $str += "}";
	        //if (usePbr) {
	        //    if (!useNormal) {
	        //        $str += "v4 = vec3(v3Normal.x,v3Normal.y,v3Normal.z);\n";
	        //    } else {
	        //        $str += 
	        //        "v4 = mat3(v3Tangent,v3Bitangent,v3Normal);\n"
	        //    }
	        //}
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = 
	        //"#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
	        //"precision highp float;\n" +
	        //" #else\n" +
	        //" precision mediump float;\n" +
	        //" #endif\n" +
	        "uniform sampler2D s_texture1;\n" +
	            //"uniform sampler2D light_texture;\n" +
	            "uniform vec4 testconst;" +
	            "varying vec2 v_texCoord;\n" +
	            //"varying vec2 v_texLight;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(s_texture, v_texCoord.xy);\n" +
	            //"if (infoUv.a <= 0.9) {\n" +
	            //"     discard;\n" +
	            //"}\n" +
	            //"vec4 infoLight = texture2D(light_texture, v_texLight);\n" +
	            //"vec4 test = vec4(0.5,0,0,1);\n" +
	            "infoUv.xyz = testconst.xyz * infoUv.xyz;\n" +
	            //"info.rgb = info.rgb / 0.15;\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}

	class SkyShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "v3Normal");
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec3 v3Position;" +
	            "attribute vec3 v3Normal;" +
	            //"attribute vec2 v2LightBuff;" +
	            "uniform mat4 viewMatrix3D;" +
	            "uniform mat4 camMatrix3D;" +
	            "uniform mat4 posMatrix3D;" +
	            "varying vec3 vNormal;" +
	            //"varying vec2 v_texLight;" +
	            "void main(void)" +
	            "{" +
	            "   vNormal = vec3(v3Normal.x, v3Normal.y,v3Normal.z);" +
	            "   vec4 vt0= vec4(v3Position, 1.0);" +
	            "   vt0 = posMatrix3D * vt0;" +
	            "   vt0 = camMatrix3D * vt0;" +
	            "   vt0 = viewMatrix3D * vt0;" +
	            "   gl_Position = vt0;" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = 
	        //"#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
	        //"precision highp float;\n" +
	        //" #else\n" +
	        //" precision mediump float;\n" +
	        //" #endif\n" +
	        "precision mediump float;\n" +
	            "uniform samplerCube s_texture;\n" +
	            //"uniform sampler2D light_texture;\n" +
	            "varying vec3 vNormal;\n" +
	            //"varying vec2 v_texLight;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = textureCube(s_texture, vNormal);\n" +
	            //"if (infoUv.a <= 0.9) {\n" +
	            //"     discard;\n" +
	            //"}\n" +
	            //"vec4 infoLight = texture2D(light_texture, v_texLight);\n" +
	            //"vec4 test = vec4(0.5,0,0,1);\n" +
	            //"vec4 test = testconst * testconst2;\n" +
	            //"test = test * testconst2;\n" +
	            //"infoUv.xyz = test.xyz * infoUv.xyz;\n" +
	            //"info.rgb = info.rgb / 0.15;\n" +
	            "gl_FragColor = infoUv;\n" +
	            "}";
	        return $str;
	    }
	}
	SkyShader.Sky_Shader = "SkyShader";

	class SkillMulPath extends SkillPath {
	    constructor() {
	        super(...arguments);
	        this.lastTime = 0;
	    }
	    setInitCurrentPos(ary) {
	        this.currentPosAry = ary;
	        this.allTimeList = new Array;
	        for (var i = 0; i < ary.length; i++) {
	            this.allTimeList.push(0);
	        }
	    }
	    add() {
	        this.skillTrajectory.setCurrentPos();
	        this.directAry = new Array;
	        var maxLenght = 0;
	        for (var i = 0; i < this.currentPosAry.length; i++) {
	            var v3d = new Vector3D();
	            v3d.x = this.currentTargetPos.x - this.currentPosAry[i].x;
	            v3d.y = this.currentTargetPos.y - this.currentPosAry[i].y;
	            v3d.z = this.currentTargetPos.z - this.currentPosAry[i].z;
	            var le = v3d.length;
	            if (le > maxLenght) {
	                maxLenght = le;
	                this.maxV3d = this.currentPosAry[i];
	            }
	            this.allTimeList[i] = le / this.speed;
	            v3d.normalize();
	            v3d.scaleBy(this.speed);
	            this.directAry.push(v3d);
	        }
	        this.alltime = maxLenght / this.speed;
	        this.setAllData();
	    }
	    setAllData() {
	        var frame = Util.float2int(this.alltime / 33) + 8;
	        this.resultAry = new Array;
	        for (var i = 0; i < this.currentPosAry.length; i++) {
	            var itemAry = new Array;
	            this.resultAry.push(itemAry);
	            var directV3d = this.directAry[i];
	            for (var k = 0; k < 6; k++) {
	                itemAry.push([this.currentPosAry[i].x, this.currentPosAry[i].y, this.currentPosAry[i].z]);
	            }
	            for (var j = 0; j < frame; j++) {
	                this.lastTime = 33 * j;
	                var per = (this.lastTime / this.allTimeList[i]);
	                var ypos = per;
	                var pos;
	                if (per >= 1) {
	                    ypos = 0;
	                    pos = [this.currentTargetPos.x, this.currentTargetPos.y, this.currentTargetPos.z];
	                }
	                else {
	                    ypos = ypos - ypos * ypos;
	                    ypos *= 250;
	                    pos = [directV3d.x * this.lastTime + this.currentPosAry[i].x, directV3d.y * this.lastTime + ypos + this.currentPosAry[i].y, directV3d.z * this.lastTime + this.currentPosAry[i].z];
	                }
	                var normal;
	                if (j == 0) {
	                    normal = [0, 1, 0];
	                }
	                else {
	                    var lastpos = itemAry[j * 2 - 2];
	                    normal = [pos[0] - lastpos[0], pos[1] - lastpos[1], pos[2] - lastpos[2]];
	                    var len = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
	                    normal[0] /= len;
	                    normal[1] /= len;
	                    normal[2] /= len;
	                }
	                itemAry.push(pos, normal);
	            }
	        }
	    }
	    update(t) {
	        this.time = t;
	        this.lastTime += t;
	        if (this.hasReached) {
	            this.endTime += t;
	            if (this.endTime > 200) {
	                this.applyArrive();
	            }
	            return;
	        }
	        this.skillTrajectory.setCurrentPos();
	        for (var i = 0; i < this.currentPosAry.length; i++) {
	            var ypos = (this.lastTime / this.allTimeList[i]);
	            ypos = ypos - ypos * ypos;
	            ypos *= 250;
	            var basePos = this.currentPosAry[i];
	            this._currentDirect.x = this.currentTargetPos.x - basePos.x;
	            this._currentDirect.y = this.currentTargetPos.y - basePos.y;
	            this._currentDirect.z = this.currentTargetPos.z - basePos.z;
	            this._currentDirect.normalize();
	            this._currentDirect.scaleBy(this.speed);
	            if (this.maxV3d == basePos) {
	                this.setRotationMatrix(this.currentTargetPos.subtract(basePos));
	                if (this._currentDirect.length == 0) {
	                    this.arrive();
	                    return;
	                }
	            }
	            var currentDistance = this._currentDirect.length * this.time;
	            if (!this.hasReached) {
	                var targetDistance = Vector3D.distance(basePos, this.currentTargetPos);
	                basePos.x += this._currentDirect.x * this.time;
	                basePos.y += this._currentDirect.y * this.time;
	                basePos.z += this._currentDirect.z * this.time;
	                basePos.w = ypos;
	            }
	            if (this.maxV3d == basePos) {
	                if (currentDistance > targetDistance) {
	                    this.arrive();
	                }
	            }
	        }
	        this.currentPos.setTo(this.currentPosAry[0].x, this.currentPosAry[0].y + this.currentPosAry[0].w, this.currentPosAry[0].z);
	    }
	    setData($skillTrajectory, $endFun, $currentPos, $rotationMatrix, $currentTargetPos) {
	        super.setData($skillTrajectory, $endFun, $currentPos, $rotationMatrix, $currentTargetPos, null);
	        this.skillMul = $skillTrajectory;
	    }
	    applyData(ary) {
	        for (var i = 0; i < ary.length; i++) {
	            ary[i].setTo(this.currentPosAry[i].x, this.currentPosAry[i].y + this.currentPosAry[i].w, this.currentPosAry[i].z);
	        }
	    }
	    reset() {
	        super.reset();
	        this.lastTime = 0;
	    }
	}

	class TextAlign {
	}
	TextAlign.LEFT = "left";
	TextAlign.CENTER = "center";
	TextAlign.RIGHT = "right";
	TextAlign.TOP = "top";
	TextAlign.MIDDLE = "middle";
	TextAlign.BOTTOM = "bottom";

	class KeyboardType {
	}
	KeyboardType.A = 65;
	KeyboardType.B = 66;
	KeyboardType.C = 67;
	KeyboardType.D = 68;
	KeyboardType.E = 69;
	KeyboardType.F = 70;
	KeyboardType.G = 71;
	KeyboardType.H = 72;
	KeyboardType.I = 73;
	KeyboardType.J = 74;
	KeyboardType.K = 75;
	KeyboardType.L = 76;
	KeyboardType.M = 77;
	KeyboardType.N = 78;
	KeyboardType.O = 79;
	KeyboardType.P = 80;
	KeyboardType.Q = 81;
	KeyboardType.R = 82;
	KeyboardType.S = 83;
	KeyboardType.T = 84;
	KeyboardType.U = 85;
	KeyboardType.V = 86;
	KeyboardType.W = 87;
	KeyboardType.X = 88;
	KeyboardType.Y = 89;
	KeyboardType.Z = 90;
	KeyboardType.Left = 37;
	KeyboardType.Up = 38;
	KeyboardType.Right = 39;
	KeyboardType.Down = 40;
	KeyboardType.Delete = 46;
	KeyboardType.F1 = 112;
	KeyboardType.F2 = 113;

	class RoleResLow extends RoleRes {
	}

	class CapsuleVo {
	    constructor($radius, $height) {
	        this.radius = $radius;
	        this.height = $height;
	    }
	}

	class ModelSceneChar extends SceneChar {
	    setWeaponByAvatar(avatar, $suffix = "") {
	        this.addPart(SceneChar.WEAPON_PART, SceneChar.WEAPON_DEFAULT_SLOT, this.getSceneCharWeaponUrl(avatar, $suffix));
	    }
	    setWingByID($wingId) {
	        if (!this._wingDisplay) {
	            this._wingDisplay = new SceneBaseChar();
	        }
	        this._wingDisplay.setRoleUrl(UnitFunction.getRoleUrl($wingId));
	        this._wingDisplay.setBind(this, SceneChar.WING_SLOT);
	        SceneManager.getInstance().addMovieDisplay(this._wingDisplay);
	    }
	    setMountById($mountId) {
	        if (!this.mountChar) {
	            this.mountChar = new MountChar();
	        }
	        this.mountChar.setRoleUrl(UnitFunction.getRoleUrl($mountId));
	        this.setBind(this.mountChar, SceneChar.MOUNT_SLOT);
	        SceneManager.getInstance().addMovieDisplay(this.mountChar);
	        this.isMount = true;
	    }
	}

	class CharModelShow {
	    constructor() {
	        this.addModelChar();
	    }
	    addModelChar() {
	        var $sc = new ModelSceneChar();
	        $sc.setRoleUrl(UnitFunction.getRoleUrl(50003));
	        $sc.setWingByID(901);
	        $sc.setMountById(4103);
	        $sc.setWeaponByAvatar(50011);
	        $sc.play(CharAction.STAND_MOUNT);
	        SceneManager.getInstance().addMovieDisplay($sc);
	    }
	}

	class SkillSceneChar extends SceneChar {
	    onMeshLoaded() {
	        super.onMeshLoaded();
	        if (this.loadFinishFun) {
	            this.loadFinishFun();
	        }
	    }
	    changeAction($action) {
	        this.curentAction = this._defaultAction;
	        if (this.changeActionFun) {
	            this.changeActionFun($action);
	        }
	    }
	    setWeaponByAvatar(avatar, $suffix = "") {
	    }
	}

	class CharSkillPlayModel {
	    constructor() {
	        this.skillFileName = "jichu_1";
	        this.charIdstr = 50001;
	        this.weaponNum = 50011;
	        this.skipId = 1;
	        this.skillEffectItem = ["skill_01", "skill_02", "skill_03", "m_skill_01", "m_skill_02", "m_skill_03"];
	        this.initSkillPlay();
	    }
	    initSkillPlay() {
	        if (!Util.getUrlParam("id")) {
	            window.location.href = "index.html?id=" + Util.random(10);
	        }
	        else {
	            this.makeUrlParam();
	            this.makeMainChar();
	        }
	    }
	    makeUrlParam() {
	        this.paramId = Number(Util.getUrlParam("id"));
	        if (isNaN(this.paramId)) {
	            this.paramId = 0;
	        }
	        this.paramId = Math.floor(this.paramId);
	        this.paramId = this.paramId % 6 + 1;
	        if (this.paramId <= 0 || this.paramId > 6) {
	            this.paramId = 1;
	        }
	        if (this.paramId == 3 || this.paramId == 4) {
	            this.makeAttackChar();
	        }
	        this.skillFileName = "jichu_" + (Math.ceil(this.paramId / 2));
	        this.charIdstr = 5000 + this.paramId;
	        this.weaponNum = 50010 + this.paramId;
	    }
	    makeAttackChar() {
	        var $sc = new SceneChar();
	        $sc.z = 100;
	        $sc.setRoleUrl(UnitFunction.getRoleUrl(7001));
	        SceneManager.getInstance().addMovieDisplay($sc);
	        this.attackTarget = $sc;
	        this.attackTarget.x = Util.random(50) + 30;
	        this.attackTarget.z = Util.random(50) + 30;
	    }
	    makeMainChar() {
	        SkillManager.getInstance().preLoadSkill(UnitFunction.getSkillUrl(this.skillFileName));
	        var $sc = new SkillSceneChar();
	        $sc.setRoleUrl(UnitFunction.getRoleUrl(this.charIdstr));
	        SceneManager.getInstance().addMovieDisplay($sc);
	        $sc.setWeaponByAvatar(this.weaponNum);
	        this.mainChar = $sc;
	        $sc.changeActionFun = () => { this.playSkill(); };
	        $sc.loadFinishFun = () => {
	            ResManager.getInstance().loadSkillRes(Scene_data.fileRoot + UnitFunction.getSkillUrl(this.skillFileName), ($skillRes) => {
	                SkillManager.getInstance().preLoadSkill(UnitFunction.getSkillUrl(this.skillFileName));
	                TimeUtil.addTimeOut(1000, () => { this.playSkill(); });
	                console.log(TimeUtil.getTimer());
	            });
	        };
	    }
	    playSkill() {
	        var $effectName = this.skillEffectItem[this.skipId % this.skillEffectItem.length];
	        var $skill = SkillManager.getInstance().getSkill(UnitFunction.getSkillUrl(this.skillFileName), $effectName);
	        if ($skill.keyAry) {
	            if (this.textPlaySkillFun) {
	                TimeUtil.removeTimeTick(this.textPlaySkillFun);
	                this.textPlaySkillFun = null;
	            }
	        }
	        else {
	            return;
	        }
	        if ($skill) {
	            $skill.reset();
	            $skill.isDeath = false;
	        }
	        if (this.paramId == 3 || this.paramId == 4) {
	            /*
	            if ($effectName == "skill_01" || $effectName == "skill_02" || $effectName == "skill_03") {
	                $skill.configTrajectory(this.mainChar, this.attackTarget);
	            } else {
	               
	                if ($effectName == "m_skill_01") {
	                    $skill.configFixEffect(this.mainChar);
	                } else {
	                    this.attackTarget.x = random(50) + 30;
	                    this.attackTarget.z = random(50) + 30;
	                    var $tempPos: Vector3D = new Vector3D(this.attackTarget.x, this.attackTarget.y, this.attackTarget.z)
	                    var $hitPosItem: Array<Vector3D> = new Array()
	                    $hitPosItem.push($tempPos)
	                    $skill.configFixEffect(this.mainChar, null, $hitPosItem);
	    
	                }
	            }
	            */
	            if ($effectName == "m_skill_01") {
	                $skill.configFixEffect(this.mainChar);
	            }
	            else {
	                this.attackTarget.x = Util.random(50) + 30;
	                this.attackTarget.z = Util.random(50) + 30;
	                var $tempPos = new Vector3D(this.attackTarget.x, this.attackTarget.y, this.attackTarget.z);
	                var $hitPosItem = new Array();
	                $hitPosItem.push($tempPos);
	                $skill.configFixEffect(this.mainChar, null, $hitPosItem);
	            }
	            this.mainChar.watch(this.attackTarget, true);
	        }
	        else {
	            $skill.configFixEffect(this.mainChar);
	        }
	        this.mainChar.playSkill($skill);
	        this.skipId++;
	    }
	}

	class BaseShadowShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "u2Texture");
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec3 v3Position;" +
	            "attribute vec2 u2Texture;" +
	            "uniform mat4 vpMatrix3D;" +
	            "uniform mat4 posMatrix3D;" +
	            "varying vec2 v_texCoord;" +
	            "void main(void)" +
	            "{" +
	            "   v_texCoord = vec2(u2Texture.x, u2Texture.y);" +
	            "   vec4 vt0= vec4(v3Position, 1.0);" +
	            "   vt0 = posMatrix3D * vt0;" +
	            "   vt0 = vpMatrix3D * vt0;" +
	            "   gl_Position = vt0;" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = "precision mediump float;\n" +
	            "uniform sampler2D s_texture;\n" +
	            "varying vec2 v_texCoord;\n" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 infoUv = texture2D(s_texture, v_texCoord.xy);\n" +
	            "gl_FragColor = vec4(gl_FragCoord.z,gl_FragCoord.z,0.1236,1);\n" +
	            "}";
	        return $str;
	    }
	}
	BaseShadowShader.BaseShadowShader = "BaseShadowShader";
	class ShadowModel {
	    constructor() {
	        this.sunRotationX = -90;
	        this.sunRotationY = 0;
	        this.sunDistens100 = 200;
	        this.isNeedMake = true;
	        this._visible = true;
	    }
	    static getInstance() {
	        if (!this._instance) {
	            this._instance = new ShadowModel();
	        }
	        return this._instance;
	    }
	    getFBO() {
	        FBO.fw = 1024;
	        FBO.fh = 1024;
	        //FBO.fw = 2048
	        //FBO.fh = 2048
	        this.renderContext = Scene_data.context3D.renderContext;
	        var gl = Scene_data.context3D.renderContext;
	        var fbo = new FBO();
	        fbo.texture = gl.createTexture();
	        gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
	        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, FBO.fw, FBO.fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	        fbo.frameBuffer = gl.createFramebuffer();
	        fbo.depthBuffer = gl.createRenderbuffer();
	        gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.depthBuffer);
	        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, FBO.fw, FBO.fh);
	        return fbo;
	    }
	    updateDepthTexture(fbo) {
	        var gl = Scene_data.context3D.renderContext;
	        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.frameBuffer);
	        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbo.texture, 0);
	        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fbo.depthBuffer);
	    }
	    //创建可引用的阴影贴图  （-1~+1）=》（0~1）;
	    makeUseShadowView() {
	        // Scene_data.viewMatrx3D.identity();
	        // Scene_data.viewMatrx3D.appendScale(1 / 250, 1 / 250, 1 / (this.sunDistens100 * 2));
	        Scene_data.viewMatrx3D.appendTranslation(1, 1, 1); //+1
	        Scene_data.viewMatrx3D.appendScale(0.5, 0.5, 0.5); //*0.5
	        MathClass.updateVp();
	        ShadowModel.shadowViewMatx3D = Scene_data.vpMatrix.clone();
	    }
	    setShowdowVisible(value) {
	        this._visible = value;
	        console.log("开关阴影", this._visible);
	    }
	    updateDepth($scene) {
	        ShadowModel.getInstance().sunRotationY = 45;
	        if (!$scene.fbo) {
	            $scene.fbo = this.getFBO(); //512*512
	        }
	        if (!this._visible) {
	            return;
	        }
	        var $cloneVp = Scene_data.vpMatrix.clone();
	        var $cloneView = Scene_data.viewMatrx3D.clone();
	        this.updateDepthTexture($scene.fbo);
	        this.renderContext.viewport(0, 0, FBO.fw, FBO.fh);
	        this.renderContext.clearColor(1, 1, 1, 1);
	        this.renderContext.clearDepth(1.0);
	        this.renderContext.enable(gl.DEPTH_TEST);
	        this.renderContext.depthMask(true);
	        this.renderContext.frontFace(gl.CW);
	        this.renderContext.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	        Scene_data.context3D.setWriteDepth(true);
	        Scene_data.context3D.setDepthTest(true);
	        Scene_data.viewMatrx3D.identity();
	        Scene_data.viewMatrx3D.appendScale(1 / 500, 1 / 500, 1 / 600);
	        Scene_data.cam3D.cameraMatrix.identity();
	        Scene_data.cam3D.cameraMatrix.prependRotation(this.sunRotationX, Vector3D.X_AXIS);
	        Scene_data.cam3D.cameraMatrix.prependRotation(this.sunRotationY, Vector3D.Y_AXIS);
	        Scene_data.cam3D.cameraMatrix.prependTranslation(-Scene_data.focus3D.x, 0, -Scene_data.focus3D.z);
	        var $sunNrm = new Vector3D(0, 0, -1);
	        var $m = new Matrix3D;
	        $m.appendRotation(-this.sunRotationX, Vector3D.X_AXIS);
	        $m.appendRotation(-this.sunRotationY, Vector3D.Y_AXIS);
	        $sunNrm = $m.transformVector($sunNrm);
	        $sunNrm.normalize();
	        //  (<OverrideSceneManager>$scene).light.setData($sunNrm, new Vector3D(0.5, 0.5, 0.5), new Vector3D(0.5, 0.5, 0.5));
	        $scene.light.sunDirect[0] = $sunNrm.x;
	        $scene.light.sunDirect[1] = $sunNrm.y;
	        $scene.light.sunDirect[2] = $sunNrm.z;
	        MathClass.updateVp();
	        ShadowModel.shadowViewMatx3D = Scene_data.vpMatrix.clone();
	        Scene_data.context3D.setProgram(null);
	        for (var i = 0; i < $scene.displaySpriteList.length; i++) {
	            var $a = $scene.displaySpriteList[i];
	            this.drawTempSprite($a.objData, $a.posMatrix);
	        }
	        for (var j = 0; j < $scene.displayList.length; j++) {
	            var $b = $scene.displayList[j];
	            if ($b && $b.needScanShadow) {
	                for (var k = 0; k < $b.groupItem.length; k++) {
	                    this.drawTempSprite($b.groupItem[k].objData, $b.posMatrix);
	                }
	            }
	        }
	        var gl = Scene_data.context3D.renderContext;
	        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	        gl.bindTexture(gl.TEXTURE_2D, null);
	        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	        //  console.log("扫描深度")
	        this.makeUseShadowView();
	        Scene_data.context3D.resetSize(Scene_data.stageWidth, Scene_data.stageHeight);
	        Scene_data.vpMatrix = $cloneVp;
	        Scene_data.viewMatrx3D = $cloneView;
	    }
	    drawTempSprite($objdata, $posMatrix) {
	        ProgramManager.getInstance().registe(BaseShadowShader.BaseShadowShader, new BaseShadowShader);
	        var $shader = ProgramManager.getInstance().getProgram(BaseShadowShader.BaseShadowShader);
	        if (!this._uvTextureRes) {
	            var $ctx = UIManager.getInstance().getContext2D(128, 128, false);
	            $ctx.fillStyle = "rgb(255,0,255)";
	            $ctx.fillRect(0, 0, 128, 128);
	            this._uvTextureRes = TextureManager.getInstance().getCanvasTexture($ctx);
	        }
	        Scene_data.context3D.setProgram($shader.program);
	        Scene_data.context3D.setVcMatrix4fv($shader, "vpMatrix3D", Scene_data.vpMatrix.m);
	        Scene_data.context3D.setVcMatrix4fv($shader, "posMatrix3D", $posMatrix.m);
	        var tf = Scene_data.context3D.pushVa($objdata.vertexBuffer);
	        Scene_data.context3D.setVaOffset(0, 3, $objdata.stride, 0);
	        Scene_data.context3D.setVaOffset(1, 2, $objdata.stride, $objdata.uvsOffsets);
	        Scene_data.context3D.setRenderTexture($shader, "s_texture", this._uvTextureRes.texture, 0);
	        Scene_data.context3D.drawCall($objdata.indexBuffer, $objdata.treNum);
	    }
	}

	class DirectShadowDisplay3DShader extends Shader3D {
	    constructor() {
	        super();
	    }
	    binLocation($context) {
	        $context.bindAttribLocation(this.program, 0, "v3Position");
	        $context.bindAttribLocation(this.program, 1, "v2CubeTexST");
	        $context.bindAttribLocation(this.program, 2, "v3Normal");
	    }
	    getVertexShaderString() {
	        var $str = "attribute vec3 v3Position;" +
	            "attribute vec2 v2CubeTexST;" +
	            "varying vec2 v0;" +
	            "varying vec3 v_PositionFromLight;" +
	            "varying vec3 v2;" +
	            "varying float cosTheta;" +
	            "varying float onsunFace;" +
	            "varying vec3 ambientColorF;" +
	            "attribute vec3 v3Normal;" +
	            "uniform vec3 sunDirect;" +
	            "uniform vec3 sunColor;" +
	            "uniform vec3 ambientColor;" +
	            "uniform mat4 vpMatrix3D;" +
	            "uniform mat4 posMatrix3D;" +
	            "uniform mat4 shadowViewMatx3D;" +
	            "uniform mat3 rotationMatrix3D;" +
	            "void main(void){;" +
	            "ambientColorF =ambientColor;" +
	            "v0 = vec2(v2CubeTexST.x, v2CubeTexST.y); " +
	            "vec4 vt0= vec4(v3Position, 1.0);" +
	            "vt0 = posMatrix3D * vt0;" +
	            "vt0 = vpMatrix3D * vt0;" +
	            "   vec4 vt1= vec4(v3Position, 1.0);" +
	            "   vt1 = posMatrix3D * vt1;" +
	            "   vt1 = shadowViewMatx3D * vt1;" +
	            "   v_PositionFromLight = vec3(vt1.x, vt1.y,vt1.z);" +
	            "vec3 n = rotationMatrix3D * v3Normal;" +
	            "float suncos = dot(n.xyz,sunDirect.xyz);" +
	            "onsunFace = suncos;" +
	            "cosTheta =1.0-abs(suncos);" +
	            "suncos = clamp(suncos,0.0,1.0);" +
	            "v2 = sunColor * suncos ;" +
	            "gl_Position = vt0;" +
	            "}";
	        return $str;
	    }
	    getFragmentShaderString() {
	        var $str = "precision mediump float;\n" +
	            "uniform sampler2D fs0;\n" +
	            "uniform sampler2D fs1;\n" +
	            "varying vec2 v0;\n" +
	            "varying vec3 v_PositionFromLight;\n" +
	            "varying vec3 v2;" +
	            "varying float cosTheta;" +
	            "varying float onsunFace;" +
	            "varying vec3 ambientColorF;" +
	            "void main(void)\n" +
	            "{\n" +
	            "vec4 ft5 = texture2D(fs1, v_PositionFromLight.xy); " + //深度图采样
	            "float  bias  = 0.01*cosTheta; " +
	            "bias = clamp(bias, 0.003, 0.01); " +
	            "float visibility = (v_PositionFromLight.z > ft5.x + bias) ? 0.9 : 1.0;\n" + //深度判断
	            "visibility =onsunFace<0.0?1.0:visibility ; " +
	            "vec4 ft0 = texture2D(fs0, v0); " + //正常纹理采样
	            "vec4 ft1 = vec4(v2.xyz, 1.0); " + //法线值
	            //  "ft0.xyz = ft1.xyz*ft0.xyz; " +
	            "vec4 ft2 = vec4(1, 1, 1, 1); " +
	            "float isalp = (ft5.z >0.1254) ? 1.0 : 0.2;\n" + //深度判断1254=  1236
	            "gl_FragColor = vec4((ft1.xyz*visibility+ambientColorF.xyz)*ft0.rgb , 1.0); " +
	            //    "gl_FragColor = vec4(ft1.xyz+ambientColorF.xyz, 1.0); " +
	            "}";
	        return $str;
	    }
	}
	DirectShadowDisplay3DShader.DirectShadowDisplay3DShader = "DirectShadowDisplay3DShader";
	class DirectShadowDisplay3DSprite extends Display3DSprite {
	    constructor() {
	        super();
	        this.needScanShadow = true;
	        this.nrmFlag = 0;
	        this.initData();
	    }
	    initData() {
	        ProgramManager.getInstance().registe(DirectShadowDisplay3DShader.DirectShadowDisplay3DShader, new DirectShadowDisplay3DShader);
	        this.modelShder = ProgramManager.getInstance().getProgram(DirectShadowDisplay3DShader.DirectShadowDisplay3DShader);
	    }
	    setObjUrl(value) {
	        ObjDataManager.getInstance().getObjData(Scene_data.fileRoot + value, ($obj) => {
	            this.objData = $obj;
	        });
	    }
	    update() {
	        if (this.y == 50) {
	            console.log("here");
	        }
	        for (var i = 0; i < this.groupItem.length; i++) {
	            this.drawTemp(this.groupItem[i]);
	        }
	    }
	    drawTemp($dis) {
	        if (!this._scene.fbo || !ShadowModel.shadowViewMatx3D) {
	            return;
	        }
	        var $objdata = $dis.objData;
	        var $shader = this.modelShder;
	        if ($objdata && $objdata.indexBuffer && this._uvTextureRes) {
	            Scene_data.context3D.setProgram($shader.program);
	            Scene_data.context3D.setVc3fv($shader, "sunDirect", this._scene.light.sunDirect);
	            Scene_data.context3D.setVc3fv($shader, "sunColor", this._scene.light.sunColor);
	            Scene_data.context3D.setVc3fv($shader, "ambientColor", this._scene.light.ambientColor);
	            Scene_data.context3D.setVcMatrix4fv($shader, "shadowViewMatx3D", ShadowModel.shadowViewMatx3D.m);
	            Scene_data.context3D.setVcMatrix3fv($shader, "rotationMatrix3D", $dis._rotationData);
	            Scene_data.context3D.setVcMatrix4fv($shader, "vpMatrix3D", Scene_data.vpMatrix.m);
	            Scene_data.context3D.setVcMatrix4fv($shader, "posMatrix3D", this.posMatrix.m);
	            let gl = Scene_data.context3D.renderContext;
	            Scene_data.context3D.renderContext.bindBuffer(gl.ARRAY_BUFFER, $objdata.vertexBuffer);
	            Scene_data.context3D.setVaOffset(0, 3, $objdata.stride, 0);
	            Scene_data.context3D.setVaOffset(1, 2, $objdata.stride, $objdata.uvsOffsets);
	            Scene_data.context3D.setVaOffset(2, 3, $objdata.stride, $objdata.normalsOffsets);
	            Scene_data.context3D.setRenderTexture($shader, "fs0", this._uvTextureRes.texture, 0);
	            Scene_data.context3D.setRenderTexture($shader, "fs1", this._scene.fbo.texture, 1);
	            Scene_data.context3D.drawCall($objdata.indexBuffer, $objdata.treNum);
	        }
	    }
	    updateRotationMatrix() {
	        super.updateRotationMatrix();
	        for (var i = 0; this.groupItem && i < this.groupItem.length; i++) {
	            var $dis = this.groupItem[i];
	            if ($dis && $dis._rotationData) {
	                if ($dis._rotationData) {
	                    this._rotationMatrix.getRotaion($dis._rotationData);
	                }
	            }
	        }
	    }
	    setPicUrl($str) {
	        TextureManager.getInstance().getTexture(Scene_data.fileRoot + $str, ($texture) => {
	            this._uvTextureRes = $texture;
	        });
	    }
	    setModelById($str) {
	        this.groupItem = new Array();
	        GroupDataManager.getInstance().getGroupData(Scene_data.fileRoot + UnitFunction.getModelUrl($str), (groupRes) => {
	            for (var i = 0; i < groupRes.dataAry.length; i++) {
	                var item = groupRes.dataAry[i];
	                if (item.types == BaseRes.PREFAB_TYPE) {
	                    var $dis = new Display3DSprite();
	                    $dis.setObjUrl(item.objUrl);
	                    $dis._rotationData = new Float32Array(9);
	                    this.groupItem.push($dis);
	                    if (item.materialInfoArr && item.materialInfoArr.length) {
	                        this.setPicUrl(item.materialInfoArr[0].url);
	                    }
	                    else {
	                        console.log("没有指定贴图");
	                    }
	                }
	            }
	            this.updateRotationMatrix();
	        });
	    }
	}

	exports.AnimData = AnimData;
	exports.AnimManager = AnimManager;
	exports.AstarUtil = AstarUtil;
	exports.AxisMove = AxisMove;
	exports.AxisRotaion = AxisRotaion;
	exports.Base64 = Base64;
	exports.BaseAnim = BaseAnim;
	exports.BaseDiplay3dSprite = BaseDiplay3dSprite;
	exports.BaseEvent = BaseEvent;
	exports.BaseLaya3dSprite = BaseLaya3dSprite;
	exports.BaseProcessor = BaseProcessor;
	exports.BaseRes = BaseRes;
	exports.BitMapData = BitMapData;
	exports.BoneSocketData = BoneSocketData;
	exports.BufferState = BufferState;
	exports.BuildShader = BuildShader;
	exports.Calculation = Calculation;
	exports.Camera3D = Camera3D;
	exports.CanvasPostionModel = CanvasPostionModel;
	exports.CapsuleVo = CapsuleVo;
	exports.CharAction = CharAction;
	exports.CharModelShow = CharModelShow;
	exports.CharSkillPlayModel = CharSkillPlayModel;
	exports.Circle = Circle;
	exports.CollisionVo = CollisionVo;
	exports.ColorTransition = ColorTransition;
	exports.ColorType = ColorType;
	exports.CombineParticle = CombineParticle;
	exports.CombineParticleData = CombineParticleData;
	exports.ConstItem = ConstItem;
	exports.Context3D = Context3D;
	exports.Curve = Curve;
	exports.DefineDatas = DefineDatas;
	exports.Dictionary = Dictionary;
	exports.DirectShadowDisplay3DSprite = DirectShadowDisplay3DSprite;
	exports.Display3D = Display3D;
	exports.Display3DBallPartilce = Display3DBallPartilce;
	exports.Display3DBallShader = Display3DBallShader;
	exports.Display3DBonePartilce = Display3DBonePartilce;
	exports.Display3DFacetParticle = Display3DFacetParticle;
	exports.Display3DFacetShader = Display3DFacetShader;
	exports.Display3DFollowLocusPartilce = Display3DFollowLocusPartilce;
	exports.Display3DFollowLocusShader = Display3DFollowLocusShader;
	exports.Display3DFollowPartilce = Display3DFollowPartilce;
	exports.Display3DFollowShader = Display3DFollowShader;
	exports.Display3DLocusBallPartilce = Display3DLocusBallPartilce;
	exports.Display3DLocusPartilce = Display3DLocusPartilce;
	exports.Display3DLocusShader = Display3DLocusShader;
	exports.Display3DModelObjParticle = Display3DModelObjParticle;
	exports.Display3DModelPartilce = Display3DModelPartilce;
	exports.Display3DParticle = Display3DParticle;
	exports.Display3DShadowShader = Display3DShadowShader;
	exports.Display3DSprite = Display3DSprite;
	exports.Display3DUISprite = Display3DUISprite;
	exports.Display3dModelAnimParticle = Display3dModelAnimParticle;
	exports.Display3dMovie = Display3dMovie;
	exports.Display3dShadow = Display3dShadow;
	exports.DynamicBaseConstItem = DynamicBaseConstItem;
	exports.DynamicBaseTexItem = DynamicBaseTexItem;
	exports.DynamicConstItem = DynamicConstItem;
	exports.DynamicTexItem = DynamicTexItem;
	exports.Engine = Engine;
	exports.EventDispatcher = EventDispatcher;
	exports.FpsStage = FpsStage;
	exports.GC = GC;
	exports.Groundposition = Groundposition;
	exports.GroupDataManager = GroupDataManager;
	exports.GroupRes = GroupRes;
	exports.IndexBuffer3D = IndexBuffer3D;
	exports.KeyFrame = KeyFrame;
	exports.KeyboardType = KeyboardType;
	exports.LQuaternion = LQuaternion;
	exports.LayaInsideSprite = LayaInsideSprite;
	exports.LayaOverride2dEngine = LayaOverride2dEngine;
	exports.LayaOverride2dParticleManager = LayaOverride2dParticleManager;
	exports.LayaOverride2dSceneManager = LayaOverride2dSceneManager;
	exports.LayaOverride2dSkillManager = LayaOverride2dSkillManager;
	exports.LayaOverrideGroupDataManager = LayaOverrideGroupDataManager;
	exports.LayaScene2dInit = LayaScene2dInit;
	exports.LightProbeManager = LightProbeManager;
	exports.LightVo = LightVo;
	exports.LineDisplayShader = LineDisplayShader;
	exports.LineDisplaySprite = LineDisplaySprite;
	exports.LoadManager = LoadManager;
	exports.Material = Material;
	exports.MaterialAnimShader = MaterialAnimShader;
	exports.MaterialBaseParam = MaterialBaseParam;
	exports.MaterialBatchAnimShader = MaterialBatchAnimShader;
	exports.MaterialManager = MaterialManager;
	exports.MaterialParam = MaterialParam;
	exports.MaterialShader = MaterialShader;
	exports.MathClass = MathClass;
	exports.MathUtil = MathUtil;
	exports.MathUtils3D = MathUtils3D;
	exports.Matrix3D = Matrix3D;
	exports.Matrix3x3 = Matrix3x3;
	exports.Matrix4x4 = Matrix4x4;
	exports.MeshData = MeshData;
	exports.MeshDataManager = MeshDataManager;
	exports.ModelRes = ModelRes;
	exports.ModelSceneChar = ModelSceneChar;
	exports.ModuleEventManager = ModuleEventManager;
	exports.MountChar = MountChar;
	exports.ObjData = ObjData;
	exports.ObjDataManager = ObjDataManager;
	exports.Object3D = Object3D;
	exports.Override2dEngine = Override2dEngine;
	exports.OverrideEngine = OverrideEngine;
	exports.OverrideSceneManager = OverrideSceneManager;
	exports.OverrideSkill = OverrideSkill;
	exports.OverrideSkillFixEffect = OverrideSkillFixEffect;
	exports.OverrideSkillTrajectory = OverrideSkillTrajectory;
	exports.Pan3dByteArray = Pan3dByteArray;
	exports.ParticleBallData = ParticleBallData;
	exports.ParticleBallGpuData = ParticleBallGpuData;
	exports.ParticleBoneData = ParticleBoneData;
	exports.ParticleData = ParticleData;
	exports.ParticleFacetData = ParticleFacetData;
	exports.ParticleFollowData = ParticleFollowData;
	exports.ParticleFollowLocusData = ParticleFollowLocusData;
	exports.ParticleGpuData = ParticleGpuData;
	exports.ParticleLocusData = ParticleLocusData;
	exports.ParticleLocusballData = ParticleLocusballData;
	exports.ParticleManager = ParticleManager;
	exports.ParticleModelData = ParticleModelData;
	exports.PathManager = PathManager;
	exports.PlanarShadowShader = PlanarShadowShader;
	exports.Processor = Processor;
	exports.ProgramManager = ProgramManager;
	exports.QuadTreeNode = QuadTreeNode;
	exports.Quaternion = Quaternion;
	exports.Rectangle = Rectangle;
	exports.ResCount = ResCount;
	exports.ResGC = ResGC;
	exports.ResManager = ResManager;
	exports.RoleRes = RoleRes;
	exports.RoleResLow = RoleResLow;
	exports.ScaleAnim = ScaleAnim;
	exports.ScaleChange = ScaleChange;
	exports.ScaleNoise = ScaleNoise;
	exports.SceneBaseChar = SceneBaseChar;
	exports.SceneChar = SceneChar;
	exports.SceneManager = SceneManager;
	exports.SceneQuadTree = SceneQuadTree;
	exports.SceneRes = SceneRes;
	exports.Scene_data = Scene_data;
	exports.SelfRotation = SelfRotation;
	exports.Shader3D = Shader3D;
	exports.ShaderData = ShaderData;
	exports.ShaderDefine = ShaderDefine;
	exports.Shadow = Shadow;
	exports.ShadowManager = ShadowManager;
	exports.ShadowModel = ShadowModel;
	exports.Skill = Skill;
	exports.SkillData = SkillData;
	exports.SkillEffect = SkillEffect;
	exports.SkillFixEffect = SkillFixEffect;
	exports.SkillKey = SkillKey;
	exports.SkillKeyVo = SkillKeyVo;
	exports.SkillManager = SkillManager;
	exports.SkillMulPath = SkillMulPath;
	exports.SkillMulTrajectory = SkillMulTrajectory;
	exports.SkillPath = SkillPath;
	exports.SkillRes = SkillRes;
	exports.SkillSceneChar = SkillSceneChar;
	exports.SkillSinPath = SkillSinPath;
	exports.SkillTrajectory = SkillTrajectory;
	exports.SkillVo = SkillVo;
	exports.SkinMesh = SkinMesh;
	exports.SkyShader = SkyShader;
	exports.SoundManager = SoundManager;
	exports.TerrainDisplay3DShader = TerrainDisplay3DShader;
	exports.TerrainDisplay3DSprite = TerrainDisplay3DSprite;
	exports.TestTriangle = TestTriangle;
	exports.TexItem = TexItem;
	exports.TextAlign = TextAlign;
	exports.TextureCube = TextureCube;
	exports.TextureManager = TextureManager;
	exports.TextureRes = TextureRes;
	exports.TimeLine = TimeLine;
	exports.TimeLineData = TimeLineData;
	exports.TimeUtil = TimeUtil;
	exports.UIManager = UIManager;
	exports.UnitFunction = UnitFunction;
	exports.Util = Util;
	exports.Vector2 = Vector2;
	exports.Vector2D = Vector2D;
	exports.Vector3 = Vector3;
	exports.Vector3D = Vector3D;
	exports.Vector4 = Vector4;
	exports.VertexBuffer3D = VertexBuffer3D;
	exports.VertexDeclaration = VertexDeclaration;
	exports.VertexElement = VertexElement;
	exports.VertexElementFormat = VertexElementFormat;
	exports.VertexMesh = VertexMesh;
	exports.ViewFrustum = ViewFrustum;
	exports.mainpan3d = mainpan3d;

}(this.tl3d = this.tl3d || {}));
